# JavaScript Vision Chat Demo

JavaScript equivalent of springDemo using Node.js, Express, Multer, and the OpenAI SDK.

## Run

Requires Node.js 20 or later.

```sh
cd "/Users/adityatandon/Desktop/Lecture 16/code/jsDemo"
npm install
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY.
npm start
```

## Check

```sh
npm test
```

Tests use a simulated OpenAI client; no API key or paid request is needed.

Open http://localhost:8080 after starting. Run one demo at a time on port 8080,
or change PORT in .env to run them side by side. Open the page through the server,
rather than opening index.html directly.

## Behavior

- POST /api/chat accepts multipart form data: required message, optional image.
- Responses are plain text, matching the existing frontend.
- DELETE /api/chat clears the conversation and returns an empty 200 response.
- The frontend index.html is copied unchanged from springDemo.
- Uses gpt-4o-mini, temperature 0.4, and the same system prompt as Spring.
- Image uploads use base64 image input. Upload limit: 10 MB.
- Conversation history is shared across all browsers, held in memory, and lost
  on restart, matching the Spring demo. This is a local lecture demo.
- Failed AI calls return a readable error and do not add incomplete turns to history.

Set your own OPENAI_API_KEY in .env; the example contains only a placeholder.
The key stays on the backend. No key is copied from the Spring project.

API format: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
