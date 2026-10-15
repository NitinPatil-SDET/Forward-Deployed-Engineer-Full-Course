# JavaScript support-agent demo

JavaScript counterpart of `springDemo`, using Node.js 20+ and no external packages.

## Architecture

- `src/main/TestingDemoApplication.js`: application entry point and dependency wiring.
- `src/main/SupportController.js`: `POST /chat?message=...` (also accepts URL-encoded form parameters).
- `src/main/SupportService.js`: policy loading, top-one retrieval, model orchestration, response trace.
- `src/main/ToolTracker.js`: request-scoped tool names, arguments and results.
- `src/main/tools/`: the same three tools, order fixtures and tool descriptions as Spring.
- `src/main/models/`: `AgentResponse`, `EvalCase` and `JudgeResult`.
- `src/main/infrastructure/`: OpenAI Chat Completions with a tool-call loop, embeddings and an in-memory cosine vector store (counterparts of Spring AI).
- `src/main/resources/`: unchanged policies and golden dataset; Spring system prompt and judge rubric.
- `src/test/`: offline application tests and live golden-dataset evaluation.

The controller → service → vector store / tools flow matches Spring. Response JSON retains `answer`, `retrievedDocuments`, `toolsUsed`, `toolArguments`, `toolResults` and `context`.

## Run

From `jsDemo`:

```sh
export OPENAI_API_KEY='your-api-key'
npm start
```

```sh
curl -X POST 'http://localhost:8080/chat' --data-urlencode 'message=When will ORD-101 arrive?'
```

Configuration: `OPENAI_CHAT_MODEL` defaults to `gpt-4o-mini`, `OPENAI_EMBEDDING_MODEL` to `text-embedding-3-small`, `PORT` to `8080`. `.env.example` documents these settings; export them in your shell (the app does not load `.env` automatically). Startup embeds the policies and requires API access. Choose different ports when running multiple demos.

## Verify

```sh
npm test       # Offline integration tests; no key or network required
npm run eval   # Live OpenAI calls; requires a key and incurs API usage
```

The live evaluation runs all eight Spring golden cases, checks answer presence, tool choice, normalized arguments and retrieved source, then uses a separate judge client to score relevance, correctness, faithfulness, helpfulness and hallucination freedom. Every score must reach 4/5. It prints per-case results and averages, then fails if any case fails. Model-based evaluation results can vary.

API transport follows the official [Chat Completions reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create) and [embeddings reference](https://developers.openai.com/api/reference/resources/embeddings/methods/create).
