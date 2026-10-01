# JavaScript RAG customer support

This is the JavaScript equivalent of the Spring AI example. It uses ordinary
function calls—there is no HTTP controller or API route.

The existing PDFs are read from `../spring-code/src/main/resources/knowledge`.
The Pinecone index must already exist with 1024 dimensions, matching the Java
project.

## Run

```bash
npm install
export OPENAI_API_KEY="your-openai-key"
export PINECONE_API_KEY="your-pinecone-key"
npm start -- "What is the return policy?"
```

You can also import and call `loadKnowledgeBase()` and `answerUserQuery()` from
`index.js`.
