import { config } from "../config.js";
import { embedTexts } from "../gemini/embeddings.js";
import { search } from "../store/vector-store.js";
import { generate } from "../gemini/client.js";
import { buildPrompt } from "../po/system-prompt.js";

export interface AskResult {
  answer: string;
  sources: string[];
}

export async function askProject(project: string, question: string): Promise<AskResult> {
  const [vector] = await embedTexts([question], "RETRIEVAL_QUERY");
  const matches = await search(project, vector, config.topK);

  const prompt = buildPrompt(
    question,
    matches.map((match) => ({ file: match.file, text: match.text })),
  );
  const answer = await generate(prompt);

  const sources = [...new Set(matches.map((match) => match.file))];
  return { answer, sources };
}
