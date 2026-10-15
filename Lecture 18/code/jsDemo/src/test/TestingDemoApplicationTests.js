import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { ChatClient } from '../main/infrastructure/ChatClient.js';
import { createApplication } from '../main/TestingDemoApplication.js';

class FakeClient extends ChatClient {
  constructor() { super({ apiKey: 'offline-test' }); this.requests = []; }
  async embed(texts) {
    return texts.map(text => /\breturn\b|send it back/i.test(text) ? [1, 0, 0]
      : /refund/i.test(text) ? [0, 1, 0] : [0, 0, 1]);
  }
  async complete(messages, tools) {
    this.requests.push(structuredClone(messages));
    const question = messages.find(message => message.role === 'user').content;
    const results = messages.filter(message => message.role === 'tool');
    if (results.length) return { role: 'assistant', content: results.map(message => message.content).join(' ') };
    const orderId = question.match(/ord-\d+/i)?.[0];
    if (orderId) {
      const name = /arrive/i.test(question) ? 'getDeliveryEstimate'
        : /refund/i.test(question) ? 'getRefundAmount' : 'getOrderStatus';
      assert.equal(tools.length, 3);
      return { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function',
        function: { name, arguments: JSON.stringify({ orderId }) } }] };
    }
    return { role: 'assistant', content: 'Products can be returned within 30 days of delivery.' };
  }
}

test('loads policies, retrieves top one and completes tool calls with Spring response fields', async () => {
  const client = new FakeClient();
  const { supportService } = await createApplication(client);
  const response = await supportService.chat('How many days do I have to return a product?');
  assert.deepEqual(response.retrievedDocuments, ['return-policy.txt']);
  assert.match(response.context, /within 30 days/);
  assert.deepEqual(response.toolsUsed, []);
  assert.deepEqual(Object.keys(response).sort(),
    ['answer', 'context', 'retrievedDocuments', 'toolArguments', 'toolResults', 'toolsUsed']);
  for (const [question, name, expected] of [
    ['Where is ord-101?', 'getOrderStatus', /SHIPPED/],
    ['When will ORD-101 arrive?', 'getDeliveryEstimate', /15 October 2026/],
    ['How much refund for ORD-103?', 'getRefundAmount', /INR 4999/],
    ['Where is ORD-999?', 'getOrderStatus', /Order not found/],
  ]) {
    const result = await supportService.chat(question);
    assert.deepEqual(result.toolsUsed, [name]);
    assert.match(result.answer, expected);
    assert.equal(result.toolArguments[name], question.match(/ord-\d+/i)[0].toUpperCase());
    assert.equal(result.toolResults[name], result.answer);
  }
  const [status, refund, policy] = await Promise.all([
    supportService.chat('Where is ORD-101?'), supportService.chat('How much refund for ORD-103?'),
    supportService.chat('What is the return policy?'),
  ]);
  assert.deepEqual(status.toolsUsed, ['getOrderStatus']);
  assert.deepEqual(refund.toolsUsed, ['getRefundAmount']);
  assert.deepEqual(policy.toolsUsed, []);
});

test('POST /chat accepts query and form parameters and rejects missing messages', async t => {
  const { server } = await createApplication(new FakeClient());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const url = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${url}/chat?message=Where%20is%20ORD-101`, { method: 'POST' });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).toolsUsed, ['getOrderStatus']);
  const form = await fetch(`${url}/chat`, { method: 'POST', body: new URLSearchParams({ message: 'return policy' }) });
  assert.equal(form.status, 200);
  assert.deepEqual((await form.json()).retrievedDocuments, ['return-policy.txt']);
  assert.equal((await fetch(`${url}/chat`, { method: 'POST' })).status, 400);
  assert.equal((await fetch(`${url}/missing`, { method: 'POST' })).status, 404);
});

test('rejects invalid model tool calls and bounds tool-call loops', async () => {
  const client = new FakeClient();
  const { supportService } = await createApplication(client);
  client.complete = async () => ({ tool_calls: [{ id: 'bad', function: { name: 'notAllowed', arguments: '{}' } }] });
  await assert.rejects(() => supportService.chat('Where is ORD-101?'), /Invalid model tool call/);
  client.complete = async () => ({ role: 'assistant', tool_calls: [{ id: 'repeat', type: 'function',
    function: { name: 'getOrderStatus', arguments: '{"orderId":"ORD-101"}' } }] });
  await assert.rejects(() => supportService.chat('Where is ORD-101?'), /Tool-call limit/);
});
