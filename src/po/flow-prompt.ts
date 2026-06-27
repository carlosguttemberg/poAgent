export interface ProjectDoc {
  file: string;
  content: string;
}

export function buildFlowPrompt(docs: ProjectDoc[]): string {
  const context = docs.map((doc) => `[Arquivo: ${doc.file}]\n${doc.content}`).join("\n\n");

  return `Você é um Product Owner. Com base EXCLUSIVAMENTE na documentação abaixo, identifique o fluxo principal do processo de negócio descrito, como uma sequência ordenada de etapas.

Responda APENAS com um JSON no formato exato abaixo, sem texto adicional, sem markdown, sem comentários:

{"steps": [{"title": "Nome curto da etapa", "description": "Descrição breve em 1-2 frases"}]}

Regras:
- Use português do Brasil.
- Baseie-se apenas no que está escrito na documentação a seguir — não invente etapas que não estejam descritas.
- Ordene as etapas na sequência em que acontecem no fluxo de negócio.
- Use no mínimo 3 e no máximo 10 etapas.

## Documentação

${context}`;
}
