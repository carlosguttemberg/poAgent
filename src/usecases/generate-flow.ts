import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { config } from "../config.js";
import { readProjectFiles } from "../docs/loader.js";
import { generate } from "../gemini/client.js";
import { buildFlowPrompt } from "../po/flow-prompt.js";
import { buildFlowHtml, type FlowData } from "../po/flow-template.js";

const FlowStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  details: z.array(z.string()).default([]),
});

const FlowPhaseSchema = z.object({
  title: z.string().min(1),
  steps: z.array(FlowStepSchema).min(1),
});

const FlowResponseSchema = z.object({
  title: z.string().min(1),
  overview: z.string().min(1),
  phases: z.array(FlowPhaseSchema).min(1),
});

function parseFlowResponse(raw: string): FlowData {
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

  return result.data;
}

export interface GenerateFlowResult {
  project: string;
  phases: number;
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
  const data = parseFlowResponse(raw);

  const html = buildFlowHtml(project, data);

  await mkdir(config.outputDir, { recursive: true });
  const outputPath = join(config.outputDir, `${project}-fluxo.html`);
  await writeFile(outputPath, html, "utf-8");

  const totalSteps = data.phases.reduce((n, p) => n + p.steps.length, 0);
  return { project, phases: data.phases.length, steps: totalSteps, outputPath };
}
