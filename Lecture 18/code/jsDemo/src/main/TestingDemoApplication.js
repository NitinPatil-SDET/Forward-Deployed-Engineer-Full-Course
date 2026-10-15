import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { ChatClient } from './infrastructure/ChatClient.js';
import { SimpleVectorStore } from './infrastructure/SimpleVectorStore.js';
import { ToolTracker } from './ToolTracker.js';
import { OrderStatusTool } from './tools/OrderStatusTool.js';
import { DeliveryEstimateTool } from './tools/DeliveryEstimateTool.js';
import { RefundAmountTool } from './tools/RefundAmountTool.js';
import { SupportService } from './SupportService.js';
import { SupportController } from './SupportController.js';

export async function createApplication(client = new ChatClient()) {
  const tracker = new ToolTracker();
  const vectorStore = new SimpleVectorStore(client);
  const supportService = new SupportService(client, vectorStore, new OrderStatusTool(tracker),
    new DeliveryEstimateTool(tracker), new RefundAmountTool(tracker), tracker);
  await supportService.loadKnowledgeBase();
  const controller = new SupportController(supportService);
  const server = createServer((req, res) => {
    controller.handle(req, res).catch(error => {
      console.error(error.message);
      if (!res.headersSent) res.writeHead(500);
      res.end(JSON.stringify({ error: 'Request failed' }));
    });
  });
  return { server, supportService, controller };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { server } = await createApplication();
  const port = Number(process.env.PORT ?? 8080);
  server.listen(port, '127.0.0.1', () => console.log(`Support agent listening on http://localhost:${port}`));
}
