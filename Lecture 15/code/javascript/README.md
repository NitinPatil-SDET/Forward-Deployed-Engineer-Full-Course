# JavaScript task client and MCP server

This is the JavaScript equivalent of the Java `taskClient` and `taskServer` projects.

## Run

Use Node.js 20 or newer. Start the MCP server first:

```bash
cd taskServer
npm install
npm start
```

In another terminal, start the client:

```bash
cd taskClient
npm install
export OPENAI_API_KEY="your-key"
npm start
```

Try the same endpoints as the Java client:

```text
http://127.0.0.1:8080/ask?message=Create%20a%20task%20called%20Study
http://127.0.0.1:8080/ask?message=List%20my%20tasks
http://127.0.0.1:8080/plan?hours=3
```

Optional environment variables are shown in `taskClient/.env.example`.
