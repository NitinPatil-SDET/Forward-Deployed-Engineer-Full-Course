import OpenAI from "openai";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const openai = new OpenAI();
const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const mcpUrl = process.env.MCP_SERVER_URL || "http://127.0.0.1:8081/mcp";

const mcpClient = new Client({ name: "task-client", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));

await mcpClient.connect(transport);

function toOpenAITools(mcpTools) {
  return mcpTools.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  }));
}

function toolResultText(result) {
  return result.content
    .map((block) => (block.type === "text" ? block.text : JSON.stringify(block)))
    .join("\n");
}

async function askModel(message, instructions) {
  const { tools: mcpTools } = await mcpClient.listTools();
  const tools = toOpenAITools(mcpTools);
  const input = [{ role: "user", content: message }];

  for (let round = 0; round < 10; round += 1) {
    const response = await openai.responses.create({
      model,
      instructions,
      tools,
      input,
    });

    input.push(...response.output);
    const toolCalls = response.output.filter((item) => item.type === "function_call");

    if (toolCalls.length === 0) {
      return response.output_text;
    }

    for (const toolCall of toolCalls) {
      const result = await mcpClient.callTool({
        name: toolCall.name,
        arguments: JSON.parse(toolCall.arguments),
      });

      input.push({
        type: "function_call_output",
        call_id: toolCall.call_id,
        output: toolResultText(result),
      });
    }
  }

  throw new Error("The model used too many tool-calling rounds.");
}

export async function chat(message) {
  const result = await mcpClient.readResource({ uri: "task://guidelines" });
  const guidelines = result.contents[0].text;

  const instructions = `You are a task management assistant.

Use the following task management guidelines whenever they are relevant
to the user's question.

TASK GUIDELINES:

${guidelines}`;

  return askModel(message, instructions);
}

export async function planDay(hours) {
  const result = await mcpClient.getPrompt({
    name: "plan_day",
    arguments: { availableHours: hours },
  });

  return askModel(result.messages[0].content.text);
}

export async function closeChatService() {
  await transport.terminateSession();
  await mcpClient.close();
}
