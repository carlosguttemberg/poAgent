import { z } from "zod";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env opcional — variáveis podem vir do ambiente
  }
}

function readProjectIdFromJson(credPath: string): string | undefined {
  try {
    const raw = readFileSync(resolve(credPath), "utf-8");
    const json = JSON.parse(raw) as { project_id?: string };
    return json.project_id;
  } catch {
    return undefined;
  }
}

loadEnv();

const ConfigSchema = z.object({
  googleApplicationCredentials: z.string().min(1, "GOOGLE_APPLICATION_CREDENTIALS é obrigatório"),
  gcpProjectId: z.string().min(1, "project_id não encontrado — defina GCP_PROJECT_ID ou verifique o JSON da service account"),
  gcpLocation: z.string().default("us-central1"),
  geminiModel: z.string().default("gemini-2.5-pro"),
  embedModel: z.string().default("gemini-embedding-001"),
  embedDim: z.coerce.number().int().positive().default(1536),
  topK: z.coerce.number().int().positive().default(6),
  docsDir: z.string().default("./docs"),
  dbPath: z.string().default("./data/lancedb"),
});

export type Config = z.infer<typeof ConfigSchema>;

function buildConfig(): Config {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "";
  const projectIdFromJson = credPath ? readProjectIdFromJson(credPath) : undefined;

  const result = ConfigSchema.safeParse({
    googleApplicationCredentials: credPath,
    gcpProjectId: process.env.GCP_PROJECT_ID ?? projectIdFromJson,
    gcpLocation: process.env.GCP_LOCATION,
    geminiModel: process.env.GEMINI_MODEL,
    embedModel: process.env.EMBED_MODEL,
    embedDim: process.env.EMBED_DIM,
    topK: process.env.TOP_K,
    docsDir: process.env.DOCS_DIR,
    dbPath: process.env.DB_PATH,
  });

  if (!result.success) {
    const msgs = result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    console.error(`\nErro de configuração:\n${msgs}\n`);
    console.error("Copie .env.example para .env e preencha os valores obrigatórios.\n");
    process.exit(1);
  }

  return result.data;
}

export const config = buildConfig();

export function printConfig(cfg: Config): void {
  console.log("Config carregada:", JSON.stringify(cfg, null, 2));
}
