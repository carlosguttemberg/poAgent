#!/usr/bin/env node
import { Command } from "commander";

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
        `Projeto '${result.project}' indexado: ${result.chunks} chunks de ${result.files} arquivo(s).`,
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
  .action((projeto: string, pergunta?: string) => {
    console.log(
      `[stub] comando 'ask ${projeto} ${pergunta ?? ""}' ainda não implementado (Fase 5).`,
    );
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
