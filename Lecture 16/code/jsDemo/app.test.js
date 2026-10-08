import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
import { ChatService } from './chatService.js';

// Exercise real HTTP/multipart handling without spending API credits.
test('frontend, text/image chat, history, reset, validation and provider failure', async () => {
  const requests = [];
  let fail = false;
  const client = { chat: { completions: { async create(request) {
    requests.push(structuredClone(request));
    if (fail) throw new Error('Simulated provider failure');
    return { choices: [{ message: { content: 'Test reply' } }] };
  } } } };
  const service = new ChatService(client);
  const server = createApp(service).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const send = (message, image) => {
    const form = new FormData();
    if (message !== undefined) form.append('message', message);
    if (image) form.append('image', image, 'upload.png');
    return fetch(`${url}/api/chat`, { method: 'POST', body: form });
  };
  try {
    assert.match(await (await fetch(url)).text(), /Vision Chat/);
    let response = await send('Hello');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/plain/);
    assert.equal(await response.text(), 'Test reply');
    assert.equal(requests[0].model, 'gpt-4o-mini');
    assert.equal(requests[0].temperature, 0.4);
    assert.equal(requests[0].messages[0].role, 'system');
    response = await send('Describe it', new Blob(['image bytes'], { type: 'image/png' }));
    assert.equal(response.status, 200);
    assert.equal(requests[1].messages.length, 4);
    const content = requests[1].messages[3].content;
    assert.equal(content[0].text, 'Describe it');
    assert.equal(content[1].image_url.url, `data:image/png;base64,${Buffer.from('image bytes').toString('base64')}`);
    assert.equal((await fetch(`${url}/api/chat`, { method: 'DELETE' })).status, 200);
    await send('New conversation');
    assert.equal(requests[2].messages.length, 2);
    assert.equal((await send(undefined)).status, 400);
    assert.equal((await send('Bad file', new Blob(['text'], { type: 'text/plain' }))).status, 400);
    assert.equal((await send('Too large', new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: 'image/png' }))).status, 413);
    fail = true;
    assert.equal((await send('Failure')).status, 502);
    assert.equal(service.history.length, 2);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
