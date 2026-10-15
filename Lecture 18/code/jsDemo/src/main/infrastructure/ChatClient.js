export class ChatClient {
  constructor({ apiKey = process.env.OPENAI_API_KEY,
    model = process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
    embeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
    baseUrl = 'https://api.openai.com/v1' } = {}) {
    if (!apiKey) throw new Error('Set OPENAI_API_KEY before starting the application');
    Object.assign(this, { apiKey, model, embeddingModel, baseUrl });
  }
  async post(path, body) {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`OpenAI ${path} failed (HTTP ${response.status})`);
    return response.json();
  }
  async embed(texts) {
    const result = await this.post('embeddings', { model: this.embeddingModel, input: texts });
    return result.data.sort((a, b) => a.index - b.index).map(item => item.embedding);
  }
  async complete(messages, tools = [], json = false) {
    const result = await this.post('chat/completions', {
      model: this.model, temperature: 0.2, messages,
      ...(tools.length ? { tools } : {}),
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    });
    return result.choices[0].message;
  }
  async chat(system, question, registry) {
    const messages = [{ role: 'system', content: system }, { role: 'user', content: question }];
    const tools = Object.entries(registry).map(([name, tool]) => ({ type: 'function', function: {
      name, description: tool.description, parameters: {
        type: 'object', properties: { orderId: { type: 'string', description: 'Order ID such as ORD-101' } },
        required: ['orderId'], additionalProperties: false,
      },
    } }));
    for (let round = 0; round < 10; round++) {
      const message = await this.complete(messages, tools);
      if (!message.tool_calls?.length) {
        if (!message.content?.trim()) throw new Error('Model returned an empty answer');
        return message.content;
      }
      messages.push(message);
      for (const call of message.tool_calls) {
        const tool = registry[call.function.name];
        const args = JSON.parse(call.function.arguments);
        if (!tool || typeof args.orderId !== 'string' || !args.orderId.trim()) {
          throw new Error('Invalid model tool call');
        }
        messages.push({ role: 'tool', tool_call_id: call.id, content: tool.execute(args.orderId) });
      }
    }
    throw new Error('Tool-call limit exceeded');
  }
}
