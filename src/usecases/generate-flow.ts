import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { config } from "../config.js";
import { readProjectFiles } from "../docs/loader.js";
import { generate } from "../gemini/client.js";
import { buildFlowPrompt } from "../po/flow-prompt.js";
import { buildFlowHtml, type FlowStep } from "../po/flow-template.js";

const FlowStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});
const FlowResponseSchema = z.object({ steps: z.array(FlowStepSchema).min(1) });

function parseFlowResponse(raw: string): FlowStep[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Resposta do modelo não é um JSON válido.");
  }

  const result = FlowResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Resposta do modelo não corresponde ao formato esperado de fluxo.");
  }

  return result.data.steps;
}

export interface GenerateFlowResult {
  project: string;
  steps: number;
  outputPath: string;
}

export async function generateFlow(project: string): Promise<GenerateFlowResult> {
  const files = await readProjectFiles(project);
  if (files.length === 0) {
    throw new Error(`Nenhum conteúdo encontrado para gerar o fluxo do projeto '${project}'.`);
  }

  const prompt = buildFlowPrompt(files);
  const raw = await generate(prompt);
  const steps = parseFlowResponse(raw);

  const html = buildFlowHtml(project, steps);

  await mkdir(config.outputDir, { recursive: true });
  const outputPath = join(config.outputDir, `${project}-fluxo.html`);
  await writeFile(outputPath, html, "utf-8");

  return { project, steps: steps.length, outputPath };
}
