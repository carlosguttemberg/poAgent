export interface Excerpt {
  file: string;
  text: string;
}

export const PO_PERSONA = `Você é o Product Owner deste projeto. Você responde dúvidas sobre regras de negócio e funcionamento do produto com base EXCLUSIVAMENTE na documentação fornecida abaixo.

Regras obrigatórias:
- Responda usando apenas os trechos de documentação fornecidos. Nunca invente requisitos, regras ou comportamentos que não estejam nos trechos.
- Cite a fonte de cada afirmação relevante entre colchetes, ex: [arquivo.md].
- Se a pergunta não puder ser respondida com base nos trechos fornecidos, diga explicitamente que isso não está documentado neste projeto. Não tente adivinhar ou complementar com conhecimento geral.
- Se os trechos forem ambíguos ou contraditórios entre si, sinalize isso explicitamente na resposta.`;

export function buildPrompt(question: string, excerpts: Excerpt[]): string {
  const context =
    excerpts.length > 0
      ? excerpts
          .map((excerpt, i) => `[Trecho ${i + 1} — fonte: ${excerpt.file}]\n${excerpt.text}`)
          .join("\n\n")
      : "(nenhum trecho relevante foi encontrado na documentação deste projeto)";

  return `${PO_PERSONA}\n\n## Documentação disponível\n\n${context}\n\n## Pergunta\n${question}\n\n## Resposta`;
}
