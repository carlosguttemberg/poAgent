import { inflateRaw } from "node:zlib";
import { promisify } from "node:util";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import fg from "fast-glob";
import { config } from "../config.js";

const inflateRawAsync = promisify(inflateRaw);

export interface ProjectFile {
  file: string;
  content: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractDrawioText(raw: string): Promise<string> {
  let xml = raw;

  // Compressed draw.io: diagrama codificado em base64+deflate dentro de <diagram>
  if (!raw.includes("<mxCell") && !raw.includes("<mxGraphModel")) {
    const diagramMatch = raw.match(/<diagram[^>]*>([\s\S]+?)<\/diagram>/i);
    if (diagramMatch) {
      try {
        const buffer = Buffer.from(diagramMatch[1].trim(), "base64");
        const decompressed = await inflateRawAsync(buffer);
        xml = decodeURIComponent(decompressed.toString("utf-8"));
      } catch {
        // não foi comprimido — tenta interpretar como está
      }
    }
  }

  const labels: string[] = [];

  // Extrai o atributo value de todos os mxCell (rótulos das formas)
  const valueRe = /\bvalue="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = valueRe.exec(xml)) !== null) {
    const text = decodeHtmlEntities(m[1]);
    if (text && !/^[01]$/.test(text)) labels.push(text);
  }

  // Extrai tooltips (às vezes contêm descrições adicionais)
  const tooltipRe = /\btooltip="([^"]+)"/g;
  while ((m = tooltipRe.exec(xml)) !== null) {
    const text = m[1].trim();
    if (text) labels.push(text);
  }

  return labels.join("\n");
}

function extractGenericXmlText(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readFileContent(absolutePath: string, file: string): Promise<string> {
  const raw = await readFile(absolutePath, "utf-8");
  const ext = file.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "drawio") {
    return extractDrawioText(raw);
  }

  if (ext === "xml") {
    const isDrawio =
      raw.includes("mxCell") || raw.includes("mxGraphModel") || raw.includes("<mxfile");
    return isDrawio ? extractDrawioText(raw) : extractGenericXmlText(raw);
  }

  return raw;
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
  const matches = await fg("**/*.{md,mdx,txt,drawio,xml}", {
    cwd: projectDir,
    ignore: ["**/node_modules/**", "**/.git/**"],
    absolute: true,
  });

  const files = await Promise.all(
    matches.sort().map(async (absolutePath) => {
      const file = relative(projectDir, absolutePath);
      return { file, content: await readFileContent(absolutePath, file) };
    }),
  );

  return files.filter((f) => f.content.trim().length > 0);
}
