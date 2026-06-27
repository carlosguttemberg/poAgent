import { config } from "../config.js";
import { getAccessToken } from "../auth/gemini-auth.js";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_BATCH_SIZE = 5;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

interface BatchEmbedResponse {
  embeddings?: { values: number[] }[];
}

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

async function embedBatch(
  texts: string[],
  taskType: EmbeddingTaskType,
  token: string,
): Promise<number[][]> {
  const url = `${BASE_URL}/${config.embedModel}:batchEmbedContents`;
  const body = JSON.stringify({
    requests: texts.map((text) => ({
      model: `models/${config.embedModel}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: config.embedDim,
    })),
  });

  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (response.ok) {
      const data = (await response.json()) as BatchEmbedResponse;
      if (!data.embeddings || data.embeddings.length !== texts.length) {
        throw new Error("Resposta de embeddings incompleta ou vazia.");
      }
      return data.embeddings.map((embedding) => normalize(embedding.values));
    }

    if (attempt < MAX_RETRIES && RETRYABLE_STATUS.has(response.status)) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`Embeddings: tentativa ${attempt + 1} falhou (${response.status}). Aguardando ${delay}ms...`);
      await sleep(delay);
      attempt++;
      continue;
    }

    const errBody = await response.text();
    throw new Error(`Embeddings API ${response.status}: ${errBody}`);
  }

  throw new Error("Número máximo de tentativas atingido ao gerar embeddings.");
}

export async function embedTexts(
  texts: string[],
  taskType: EmbeddingTaskType,
  batchSize: number = DEFAULT_BATCH_SIZE,
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const token = await getAccessToken(config.googleApplicationCredentials);
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    try {
      results.push(...(await embedBatch(batch, taskType, token)));
    } catch (error) {
      if (batch.length === 1) throw error;
      console.warn("Embeddings: lote falhou, tentando individualmente...");
      for (const text of batch) {
        results.push(...(await embedBatch([text], taskType, token)));
      }
    }
  }

  return results;
}
