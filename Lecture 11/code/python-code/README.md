# Python RAG customer support

This is the Python equivalent of the Spring AI example. It uses ordinary
function calls—there is no HTTP controller or API route.

The existing PDFs are read from `../spring-code/src/main/resources/knowledge`.
The Pinecone index must already exist with 1024 dimensions, matching the Java
project.

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export OPENAI_API_KEY="your-openai-key"
export PINECONE_API_KEY="your-pinecone-key"
python main.py "What is the return policy?"
```

You can also import and call `load_knowledge_base()` and `answer_user_query()`
from `main.py`.
