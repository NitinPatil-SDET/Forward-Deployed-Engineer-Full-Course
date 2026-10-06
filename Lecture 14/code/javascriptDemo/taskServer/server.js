import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const tasks = [];

const handler = createMcpHandler(() => {
  const server = new McpServer({
    name: "task-mcp-server",
    version: "1.0.0",
  });

  server.registerTool(
    "create_task",
    {
      description: "Create a new task",
      inputSchema: z.object({
        title: z.string().min(1).describe("Title of the task"),
      }),
    },
    async ({ title }) => {
      tasks.push(title);
      return { content: [{ type: "text", text: `Task created: ${title}` }] };
    },
  );

  server.registerTool(
    "list_tasks",
    {
      description: "List all pending tasks",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(tasks) }],
    }),
  );

  server.registerTool(
    "complete_task",
    {
      description: "Complete a task using its exact title",
      inputSchema: z.object({
        title: z.string().min(1).describe("Exact title of the task"),
      }),
    },
    async ({ title }) => {
      const index = tasks.indexOf(title);
      if (index === -1) {
        return { content: [{ type: "text", text: `Task not found: ${title}` }] };
      }

      tasks.splice(index, 1);
      return { content: [{ type: "text", text: `Task completed: ${title}` }] };
    },
  );

  return server;
});

const app = createMcpExpressApp({ host: "127.0.0.1" });
const nodeHandler = toNodeHandler(handler);

app.all("/mcp", (request, response) => {
  void nodeHandler(request, response, request.body);
});

const httpServer = app.listen(8081, "127.0.0.1", () => {
  console.log("Task MCP server running at http://localhost:8081/mcp");
});

async function shutdown() {
  await handler.close();
  httpServer.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
