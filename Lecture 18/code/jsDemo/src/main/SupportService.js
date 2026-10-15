import { readFile, readdir } from 'node:fs/promises';
import { AgentResponse } from './models/AgentResponse.js';

export const resources = new URL('./resources/', import.meta.url);
export class SupportService {
  constructor(chatClient, vectorStore, orderStatusTool, deliveryEstimateTool, refundAmountTool, toolTracker) {
    Object.assign(this, { chatClient, vectorStore, toolTracker });
    this.registry = {};
    for (const [tool, name] of [[orderStatusTool, 'getOrderStatus'],
      [deliveryEstimateTool, 'getDeliveryEstimate'], [refundAmountTool, 'getRefundAmount']]) {
      this.registry[name] = { description: tool.constructor.description, execute: id => tool[name](id) };
    }
  }
  async loadKnowledgeBase() {
    const directory = new URL('knowledge/', resources);
    const names = (await readdir(directory)).filter(name => name.endsWith('.txt')).sort();
    const documents = await Promise.all(names.map(async source => ({
      text: await readFile(new URL(source, directory), 'utf8'), metadata: { source },
    })));
    await this.vectorStore.add(documents);
    this.systemPrompt = await readFile(new URL('system-prompt.txt', resources), 'utf8');
    console.log(`Knowledge base loaded: ${documents.length} documents`);
  }
  chat(question) {
    return this.toolTracker.run(async () => {
      this.toolTracker.clear();
      const documents = await this.vectorStore.similaritySearch(question, 1);
      const context = documents.map(doc => `SOURCE: ${doc.metadata.source}\n${doc.text}\n\n`).join('');
      const answer = await this.chatClient.chat(this.systemPrompt + context, question, this.registry);
      return new AgentResponse({ answer, retrievedDocuments: documents.map(doc => doc.metadata.source),
        toolsUsed: this.toolTracker.getToolsUsed(), toolArguments: this.toolTracker.getToolArguments(),
        toolResults: this.toolTracker.getToolResults(), context });
    });
  }
}
