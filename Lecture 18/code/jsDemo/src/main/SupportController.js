export class SupportController {
  constructor(supportService) { this.supportService = supportService; }
  async chat(message) { return this.supportService.chat(message); }
  async handle(request, response) {
    const url = new URL(request.url, 'http://localhost');
    response.setHeader('Content-Type', 'application/json');
    if (request.method !== 'POST' || url.pathname !== '/chat') {
      response.writeHead(404).end(JSON.stringify({ error: 'Not found' })); return;
    }
    let message = url.searchParams.get('message');
    if (message === null && request.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 65536) {
          response.writeHead(413).end(JSON.stringify({ error: 'Request too large' })); return;
        }
      }
      message = new URLSearchParams(body).get('message');
    }
    if (!message?.trim()) {
      response.writeHead(400).end(JSON.stringify({ error: 'message is required' })); return;
    }
    try { response.end(JSON.stringify(await this.chat(message))); }
    catch (error) {
      console.error(error.message);
      response.writeHead(502).end(JSON.stringify({ error: 'Unable to generate a support response' }));
    }
  }
}
