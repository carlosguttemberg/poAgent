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

export async function tableExists(project: string): Promise<boolean> {
  const db = await getConnection();
  const names = await db.tableNames();
  return names.includes(slug(project));
}

function toVectorRecord(row: Record<string, unknown>): VectorRecord {
  return {
    id: row.id as string,
    file: row.file as string,
    index: row.index as number,
    text: row.text as string,
    vector: Array.from(row.vector as Iterable<number>),
  };
}

export async function search(project: string, vector: number[], k: number): Promise<VectorRecord[]> {
  if (!(await tableExists(project))) {
    throw new Error(`Projeto '${project}' ainda não foi indexado. Rode "po ingest ${project}" primeiro.`);
  }

  const db = await getConnection();
  const table = await db.openTable(slug(project));
  const rows = await table.vectorSearch(vector).distanceType("cosine").limit(k).toArray();
  return rows.map(toVectorRecord);
}

export async function getAllRecords(project: string): Promise<VectorRecord[]> {
  if (!(await tableExists(project))) return [];

  const db = await getConnection();
  const table = await db.openTable(slug(project));
  const rows = await table.query().toArray();
  return rows.map(toVectorRecord);
}

export async function count(project: string): Promise<number> {
  if (!(await tableExists(project))) return 0;

  const db = await getConnection();
  const table = await db.openTable(slug(project));
  return table.countRows();
}
