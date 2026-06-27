import { readProjectFiles } from "../docs/loader.js";
import { chunkMarkdown } from "../docs/chunker.js";
import { embedTexts } from "../gemini/embeddings.js";
import { reset, type VectorRecord } from "../store/vector-store.js";

export interface IngestResult {
  project: string;
  files: number;
  chunks: number;
}

export async function ingestProject(project: string): Promise<IngestResult> {
  const files = await readProjectFiles(project);

  const chunks = files.flatMap((file) => chunkMarkdown(file.content, file.file));
  if (chunks.length === 0) {
    throw new Error(`Nenhum conteúdo encontrado para indexar no projeto '${project}'.`);
  }

  const vectors = await embedTexts(chunks.map((chunk) => chunk.text), "RETRIEVAL_DOCUMENT");

  const records: VectorRecord[] = chunks.map((chunk, i) => ({
    id: `${chunk.file}#${chunk.index}`,
    file: chunk.file,
    index: chunk.index,
    text: chunk.text,
    vector: vectors[i],
  }));

  await reset(project, records);

  return { project, files: files.length, chunks: chunks.length };
}
