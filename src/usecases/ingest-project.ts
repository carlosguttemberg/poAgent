import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { readProjectFiles } from "../docs/loader.js";
import { chunkMarkdown } from "../docs/chunker.js";
import { embedTexts } from "../gemini/embeddings.js";
import { config } from "../config.js";
import { getAllRecords, reset, tableExists, type VectorRecord } from "../store/vector-store.js";

export interface IngestResult {
  project: string;
  files: number;
  chunks: number;
  changedFiles: number;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function hashesFilePath(project: string): string {
  return join(config.dbPath, ".hashes", `${project}.json`);
}

async function loadHashes(project: string): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(hashesFilePath(project), "utf-8")) as Record<string, string>;
  } catch {
    return {};
  }
}

async function saveHashes(project: string, hashes: Record<string, string>): Promise<void> {
  const path = hashesFilePath(project);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(hashes, null, 2));
}

export async function ingestProject(project: string): Promise<IngestResult> {
  const files = await readProjectFiles(project);
  if (files.length === 0) {
    throw new Error(`Nenhum conteúdo encontrado para indexar no projeto '${project}'.`);
  }

  const currentHashes: Record<string, string> = {};
  for (const file of files) currentHashes[file.file] = sha256(file.content);

  const previousHashes = await loadHashes(project);
  const exists = await tableExists(project);

  const changedFiles = files.filter((file) => !exists || previousHashes[file.file] !== currentHashes[file.file]);
  const unchangedFiles = files.filter((file) => exists && previousHashes[file.file] === currentHashes[file.file]);

  if (exists && changedFiles.length === 0) {
    const chunks = await getAllRecords(project);
    return { project, files: files.length, chunks: chunks.length, changedFiles: 0 };
  }

  const changedChunks = changedFiles.flatMap((file) => chunkMarkdown(file.content, file.file));

  let newRecords: VectorRecord[] = [];
  if (changedChunks.length > 0) {
    const vectors = await embedTexts(changedChunks.map((chunk) => chunk.text), "RETRIEVAL_DOCUMENT");
    newRecords = changedChunks.map((chunk, i) => ({
      id: `${chunk.file}#${chunk.index}`,
      file: chunk.file,
      index: chunk.index,
      text: chunk.text,
      vector: vectors[i],
    }));
  }

  let keptRecords: VectorRecord[] = [];
  if (unchangedFiles.length > 0) {
    const unchangedFileNames = new Set(unchangedFiles.map((file) => file.file));
    const existing = await getAllRecords(project);
    keptRecords = existing.filter((record) => unchangedFileNames.has(record.file));
  }

  const records = [...keptRecords, ...newRecords];
  await reset(project, records);
  await saveHashes(project, currentHashes);

  return { project, files: files.length, chunks: records.length, changedFiles: changedFiles.length };
}
