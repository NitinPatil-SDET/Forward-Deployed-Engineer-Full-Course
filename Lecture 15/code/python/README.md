# Python task client and MCP server

This is the Python equivalent of the Java `taskClient` and `taskServer` projects.

## Run

Use Python 3.10 or newer. Start the MCP server first:

```bash
cd taskServer
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

In another terminal, start the client:

```bash
cd taskClient
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export OPENAI_API_KEY="your-key"
uvicorn main:app --host 127.0.0.1 --port 8080
```

Try the same endpoints as the Java client:

```text
http://127.0.0.1:8080/ask?message=Create%20a%20task%20called%20Study
http://127.0.0.1:8080/ask?message=List%20my%20tasks
http://127.0.0.1:8080/plan?hours=3
```

Optional environment variables are shown in `taskClient/.env.example`.
