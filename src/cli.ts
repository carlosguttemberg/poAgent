#!/usr/bin/env node
import { Command } from "commander";
import { createInterface } from "node:readline/promises";

const program = new Command();

program
  .name("po")
  .description("PO Agent — Product Owner com RAG multi-projeto sobre documentação")
  .version("0.1.0");

program
  .command("projects")
  .description("Lista os projetos disponíveis em docs/")
  .action(async () => {
    const { listProjects } = await import("./docs/loader.js");
    const projects = await listProjects();
    if (projects.length === 0) {
      console.log("Nenhum projeto encontrado em docs/.");
      return;
    }
    for (const project of projects) {
      console.log(project);
    }
  });

program
  .command("ingest <projeto>")
  .description("Indexa docs/<projeto>/ na tabela do projeto")
  .action(async (projeto: string) => {
    try {
      const { ingestProject } = await import("./usecases/ingest-project.js");
      const result = await ingestProject(projeto);
      console.log(
        `Projeto '${result.project}': ${result.changedFiles} arquivo(s) alterado(s), ${result.chunks} chunks no total (${result.files} arquivo(s)).`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Erro: ${message}`);
      process.exit(1);
    }
  });

program
  .command("ask <projeto> [pergunta]")
  .description("Responde usando só o índice daquele projeto")
  .action(async (projeto: string, pergunta?: string) => {
    const { askProject } = await import("./usecases/ask-project.js");

    async function ask(question: string): Promise<void> {
      const result = await askProject(projeto, question);
      console.log(result.answer);
      if (result.sources.length > 0) {
        console.log(`\nFontes: ${result.sources.join(", ")}`);
      }
    }

    if (pergunta) {
      try {
        await ask(pergunta);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Erro: ${message}`);
        process.exit(1);
      }
      return;
    }

    console.log(`Modo REPL — projeto '${projeto}'. Digite "sair" para encerrar.`);
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      while (true) {
        const question = (await rl.question("> ")).trim();
        if (!question) continue;
        if (question.toLowerCase() === "sair") break;
        try {
          await ask(question);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Erro: ${message}`);
        }
      }
    } finally {
      rl.close();
    }
  });

program
  .command("flow <projeto>")
  .description("Gera um HTML com o fluxo de negócio do projeto, desenhado em CSS")
  .action(async (projeto: string) => {
    try {
      const { generateFlow } = await import("./usecases/generate-flow.js");
      const result = await generateFlow(projeto);
      console.log(`Fluxo gerado: ${result.phases} fase(s), ${result.steps} passo(s) → ${result.outputPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Erro: ${message}`);
      process.exit(1);
    }
  });

program
  .command("auth:check")
  .description("Verifica se as credenciais do Vertex AI estão funcionando")
  .action(async () => {
    try {
      const { generate } = await import("./gemini/client.js");
      await generate("Responda apenas: ok");
      console.log("Autenticação OK — credenciais válidas e Gemini respondeu.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Falha na autenticação: ${message}`);
      process.exit(1);
    }
  });

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Erro: ${message}`);
    process.exit(1);
  }
}

void main();
