export interface ProjectDoc {
  file: string;
  content: string;
}

export function buildFlowPrompt(docs: ProjectDoc[]): string {
  const context = docs.map((doc) => `[Arquivo: ${doc.file}]\n${doc.content}`).join("\n\n");

  return `Você é um Product Owner sênior. Analise a documentação abaixo e gere um mapeamento DETALHADO do fluxo de negócio.

Responda APENAS com um JSON no formato exato abaixo, sem texto adicional, sem markdown, sem comentários:

{
  "title": "Nome descritivo do fluxo",
  "overview": "Resumo do processo em 3-4 frases, explicando o objetivo, atores envolvidos e resultado final.",
  "phases": [
    {
      "title": "Nome da fase (ex: Fase 1 — Preparação)",
      "steps": [
        {
          "title": "Nome do passo",
          "description": "Descrição completa do que acontece neste passo, em 2-4 frases. Explique o contexto, os atores e o resultado esperado.",
          "details": [
            "Regra de negócio específica ou condição importante",
            "Exceção ou caso especial que precisa ser tratado",
            "Limite, prazo ou restrição que se aplica"
          ]
        }
      ]
    }
  ]
}

Regras obrigatórias:
- Use português do Brasil.
- Extraia TODAS as regras de negócio, limites, prazos, exceções e condições mencionados na documentação — não omita nada relevante.
- Agrupe os passos em fases lógicas que representem etapas maiores do processo (mínimo 2, máximo 6 fases).
- Cada fase deve ter entre 2 e 6 passos.
- O campo "details" de cada passo deve ter entre 1 e 5 itens com regras ou condições específicas extraídas da documentação.
- Baseie-se APENAS no que está escrito na documentação — não invente nada.
- Ordene fases e passos na sequência em que ocorrem no negócio.

## Documentação

${context}`;
}
