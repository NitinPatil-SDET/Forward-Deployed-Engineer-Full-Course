# Python meeting structured output

This is the Python equivalent of the Spring Boot example. It calls
`MeetingService.schedule(...)` directly and does not expose an API endpoint.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export OPENAI_API_KEY="your-api-key"
python demo_application.py
```
