# po-agent

CLI em Node.js + TypeScript que atua como **Product Owner** de um ou mais projetos. Lê a documentação de um projeto, indexa via RAG (embeddings + LanceDB local) e responde perguntas baseando-se **exclusivamente** nos docs daquele projeto — nunca mistura contexto entre projetos diferentes.

## Setup

Requer Node 24 LTS.

```bash
npm install
cp .env.example .env
```

Preencha o `.env` com as credenciais de uma service account do Google Cloud com acesso à Generative Language API (mesmo padrão usado pelo projeto `contextExtractor`):

```
GOOGLE_APPLICATION_CREDENTIALS=./credentials/service-account.json
GCP_PROJECT_ID=
```

As demais variáveis (`GCP_LOCATION`, `GEMINI_MODEL`, `EMBED_MODEL`, `EMBED_DIM`, `TOP_K`, `DOCS_DIR`, `DB_PATH`, `OUTPUT_DIR`) já têm defaults sensatos — só ajuste se precisar.

> `docs/` (documentação dos projetos), `data/` (índices LanceDB) e `output/` (HTMLs gerados) não são versionados — `docs/` porque pode conter informação de negócio sensível, os outros dois porque são gerados.

## Fluxo dos comandos

```bash
npm run po -- auth:check                       # valida as credenciais
npm run po -- projects                          # lista projetos em docs/<projeto>/
npm run po -- ingest <projeto>                  # indexa/reindexa um projeto
npm run po -- ask <projeto> "<pergunta>"        # pergunta única
npm run po -- ask <projeto>                     # modo REPL (várias perguntas; "sair" para encerrar)
npm run po -- flow <projeto>                    # gera output/<projeto>-fluxo.html com o fluxo de negócio
```

Para usar a doc de um novo projeto, crie `docs/<nome-do-projeto>/*.md` e rode `po ingest <nome-do-projeto>`.

## Arquitetura

```
src/
├── cli.ts              # parsing de args (commander) + chamada de casos de uso
├── config.ts           # validação de env (zod)
├── auth/                # service account → access token (espelha contextExtractor)
├── gemini/               # client REST (generateContent) + embeddings (batchEmbedContents)
├── docs/                 # loader (lista/lê docs por projeto) + chunker (markdown-aware)
├── store/                # LanceDB — 1 tabela por projeto, busca por cosseno
├── usecases/              # ingest-project, ask-project e generate-flow
└── po/                    # persona/grounding (system-prompt) e geração de fluxo (flow-prompt, flow-template)
```

`po flow <projeto>` lê a documentação completa do projeto (sem passar pelo índice RAG, já que o fluxo precisa do contexto inteiro, não de top-k chunks), pede ao Gemini para extrair as etapas do processo de negócio em JSON estruturado, valida a resposta com zod e renderiza um HTML autocontido (CSS embutido, sem dependências externas) em `output/<projeto>-fluxo.html`.

**Isolamento por projeto é invariante**: `ask-project` abre apenas a tabela LanceDB do projeto perguntado. Não existe caminho de código que consulte mais de uma tabela na mesma pergunta.

## Critérios de verificação por fase

- **Fase 0** — `npm run po -- --help` lista os comandos; `npm run build` compila sem erro.
- **Fase 1** — `po auth:check` retorna sucesso com credenciais válidas e erro legível (sem stack trace, sem segredo) com credenciais ausentes/inválidas.
- **Fase 2** — `po projects` lista os projetos em `docs/`; pedir um projeto inexistente retorna erro legível.
- **Fase 3** — embeddings de 2–3 textos retornam vetores de tamanho `EMBED_DIM` e norma ~1.0.
- **Fase 4** — `po ingest <projeto>` cria a tabela do projeto em `data/lancedb` e imprime o nº de chunks; tabelas de projetos diferentes coexistem sem se sobrescrever.
- **Fase 5** (isolamento — crítico):
  1. `po ask projeto-checkout "qual a regra de cancelamento de pedido?"` → responde citando arquivo do checkout.
  2. `po ask projeto-checkout "como cadastrar um produto?"` → diz que não está documentado neste projeto, sem vazar conteúdo do catálogo.
  3. `po ask projeto-catalogo "como cadastrar um produto?"` → responde pelo catálogo.
- **Fase 6** — `po ask <projeto>` sem pergunta entra em modo REPL e responde múltiplas perguntas sem reabrir a conexão; rodar `po ingest <projeto>` duas vezes sem mudanças nos docs não reembeda nada (log indica "0 arquivo(s) alterado(s)").

## Reindexação incremental

`po ingest <projeto>` guarda um hash SHA-256 por arquivo em `data/lancedb/.hashes/<projeto>.json`. Em cada execução, só os arquivos cujo hash mudou são reembedados; os chunks dos arquivos inalterados são reaproveitados da tabela existente. Arquivos removidos da pasta `docs/<projeto>/` somem automaticamente do índice na próxima ingestão.
