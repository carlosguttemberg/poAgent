import * as lancedb from "@lancedb/lancedb";
import { config } from "../config.js";

export interface VectorRecord {
  id: string;
  file: string;
  index: number;
  text: string;
  vector: number[];
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

let connection: lancedb.Connection | null = null;

async function getConnection(): Promise<lancedb.Connection> {
  if (!connection) {
    connection = await lancedb.connect(config.dbPath);
  }
  return connection;
}

export async function reset(project: string, records: VectorRecord[]): Promise<void> {
  if (records.length === 0) {
    throw new Error(`Nenhum registro para indexar no projeto '${project}'.`);
  }
  const db = await getConnection();
  await db.createTable(slug(project), records as unknown as Record<string, unknown>[], {
    mode: "overwrite",
  });
}

export async function search(project: string, vector: number[], k: number): Promise<VectorRecord[]> {
  const db = await getConnection();
  const tableName = slug(project);

  const names = await db.tableNames();
  if (!names.includes(tableName)) {
    throw new Error(`Projeto '${project}' ainda não foi indexado. Rode "po ingest ${project}" primeiro.`);
  }

  const table = await db.openTable(tableName);
  const rows = await table.vectorSearch(vector).distanceType("cosine").limit(k).toArray();
  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    file: row.file as string,
    index: row.index as number,
    text: row.text as string,
    vector: row.vector as number[],
  }));
}

export async function count(project: string): Promise<number> {
  const db = await getConnection();
  const tableName = slug(project);

  const names = await db.tableNames();
  if (!names.includes(tableName)) return 0;

  const table = await db.openTable(tableName);
  return table.countRows();
}
