import { createServer } from "node:http";

import { chat, closeChatService, planDay } from "./chatService.js";

const httpServer = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:8080");

  try {
    let result;

    if (url.pathname === "/ask") {
      const message = url.searchParams.get("message");
      if (!message) {
        response.writeHead(400, { "Content-Type": "text/plain" });
        response.end("Query parameter 'message' is required.");
        return;
      }
      result = await chat(message);
    } else if (url.pathname === "/plan") {
      const hours = url.searchParams.get("hours");
      if (!hours) {
        response.writeHead(400, { "Content-Type": "text/plain" });
        response.end("Query parameter 'hours' is required.");
        return;
      }
      result = await planDay(hours);
    } else {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(result);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error.message);
  }
});

httpServer.listen(8080, "127.0.0.1", () => {
  console.log("Task client is running at http://127.0.0.1:8080");
});

process.on("SIGINT", async () => {
  await closeChatService();
  httpServer.close();
});
