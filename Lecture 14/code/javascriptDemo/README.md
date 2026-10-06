# JavaScript MCP task demo

## 1. Start the task server

```bash
cd taskServer
npm install
npm start
```

## 2. Start the task client

In another terminal:

```bash
cd taskClient
npm install
cp .env.example .env
```

Put your OpenAI API key in `.env`, then run:

```bash
npm start
```

## 3. Try the real MCP interaction

```bash
curl --get http://localhost:8080/ask --data-urlencode "message=Create a task called Prepare lecture notes"
curl --get http://localhost:8080/ask --data-urlencode "message=List my tasks"
curl --get http://localhost:8080/ask --data-urlencode "message=Complete the task Prepare lecture notes"
```

The model runs in `taskClient`; the task data and tools run in the separate `taskServer` process and are reached through Streamable HTTP MCP.
