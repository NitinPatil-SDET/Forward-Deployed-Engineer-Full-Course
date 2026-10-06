import { createServer } from "node:http";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import {
  localhostHostValidation,
  localhostOriginValidation,
  toNodeHandler,
} from "@modelcontextprotocol/node";
import * as z from "zod/v4";

import { completeTask, createTask, listTasks } from "./taskTools.js";
import { getGuidelines } from "./taskResources.js";
import { planDay } from "./taskPrompts.js";

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
        title: z.string().describe("Title of the task"),
      }),
    },
    async ({ title }) => ({
      content: [{ type: "text", text: createTask(title) }],
    }),
  );

  server.registerTool(
    "list_tasks",
    {
      description: "List all pending tasks",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(listTasks()) }],
    }),
  );

  server.registerTool(
    "complete_task",
    {
      description: "Complete a task using its exact title",
      inputSchema: z.object({
        title: z.string().describe("Exact title of the task"),
      }),
    },
    async ({ title }) => ({
      content: [{ type: "text", text: completeTask(title) }],
    }),
  );

  server.registerResource(
    "task-guidelines",
    "task://guidelines",
    {
      description: "Guidelines for managing and prioritizing tasks",
      mimeType: "text/plain",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/plain", text: getGuidelines() }],
    }),
  );

  server.registerPrompt(
    "plan_day",
    {
      description: "Plan pending tasks for the available time",
      argsSchema: z.object({
        availableHours: z.string().describe("Number of hours available today"),
      }),
    },
    ({ availableHours }) => ({
      description: "Plan pending tasks for the day",
      messages: [
        {
          role: "user",
          content: { type: "text", text: planDay(availableHours) },
        },
      ],
    }),
  );

  return server;
});

const nodeHandler = toNodeHandler(handler);
const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();

const httpServer = createServer((request, response) => {
  if (!validateHost(request, response) || !validateOrigin(request, response)) {
    return;
  }

  void nodeHandler(request, response);
});

httpServer.listen(8081, "127.0.0.1", () => {
  console.log("Task MCP server is running at http://127.0.0.1:8081/mcp");
});

process.on("SIGINT", async () => {
  await handler.close();
  httpServer.close();
});
