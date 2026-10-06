# Python MCP task demo

Python 3.10 or newer is required.

## 1. Start the task server

```bash
cd taskServer
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python server.py
```

## 2. Start the task client

In another terminal:

```bash
cd taskClient
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
```

Put your OpenAI API key in `.env`, then run:

```bash
python app.py
```

## 3. Try the real MCP interaction

```bash
curl --get http://localhost:8080/ask --data-urlencode "message=Create a task called Prepare lecture notes"
curl --get http://localhost:8080/ask --data-urlencode "message=List my tasks"
curl --get http://localhost:8080/ask --data-urlencode "message=Complete the task Prepare lecture notes"
```

The model runs in `taskClient`; the task data and tools run in the separate `taskServer` process and are reached through Streamable HTTP MCP.
