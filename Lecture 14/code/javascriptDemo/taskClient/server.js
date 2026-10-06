import "dotenv/config";
import express from "express";
import { Agent, MCPServerStreamableHttp, run } from "@openai/agents";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Set OPENAI_API_KEY in the .env file");
}

const mcpServer = new MCPServerStreamableHttp({
  name: "Task MCP server",
  url: process.env.MCP_SERVER_URL ?? "http://localhost:8081/mcp",
  cacheToolsList: true,
});

await mcpServer.connect();

const agent = new Agent({
  name: "Task Assistant",
  instructions: "Use the MCP task tools to handle every task-management request.",
  mcpServers: [mcpServer],
});

const app = express();

app.get("/ask", async (request, response) => {
  const message = request.query.message;
  if (typeof message !== "string" || !message.trim()) {
    return response.status(400).send("Query parameter 'message' is required");
  }

  try {
    const result = await run(agent, message);
    return response.send(String(result.finalOutput ?? ""));
  } catch (error) {
    console.error(error);
    return response.status(500).send("Unable to process the request");
  }
});

const httpServer = app.listen(8080, "127.0.0.1", () => {
  console.log("Task client running at http://localhost:8080/ask?message=List%20my%20tasks");
});

async function shutdown() {
  await mcpServer.close();
  httpServer.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
