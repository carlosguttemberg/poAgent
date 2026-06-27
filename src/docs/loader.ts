import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import fg from "fast-glob";
import { config } from "../config.js";

export interface ProjectFile {
  file: string;
  content: string;
}

export async function listProjects(): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(config.docsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export async function readProjectFiles(project: string): Promise<ProjectFile[]> {
  const projects = await listProjects();
  if (!projects.includes(project)) {
    throw new Error(`Projeto '${project}' não encontrado em ${config.docsDir}`);
  }

  const projectDir = join(config.docsDir, project);
  const matches = await fg("**/*.{md,mdx,txt}", {
    cwd: projectDir,
    ignore: ["**/node_modules/**", "**/.git/**"],
    absolute: true,
  });

  const files = await Promise.all(
    matches.sort().map(async (absolutePath) => ({
      file: relative(projectDir, absolutePath),
      content: await readFile(absolutePath, "utf-8"),
    })),
  );

  return files;
}
