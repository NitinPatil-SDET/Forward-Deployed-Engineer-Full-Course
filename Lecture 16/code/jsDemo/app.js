import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function createApp(chatService) {
  const app = express();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES, fieldSize: MAX_UPLOAD_BYTES, files: 1, fields: 1 },
    fileFilter(req, file, callback) {
      if (!file.mimetype.startsWith('image/')) {
        const error = new Error('Please upload an image file.');
        error.status = 400;
        return callback(error);
      }
      callback(null, true);
    },
  });

  app.use(express.static(path.join(directory, 'public')));
  app.post('/api/chat', (req, res, next) => {
    const size = Number(req.headers['content-length']);
    if (size > MAX_UPLOAD_BYTES) {
      return res.status(413).type('text').send('Maximum request size is 10 MB.');
    }
    next();
  }, upload.single('image'), async (req, res, next) => {
    if (typeof req.body?.message !== 'string') {
      return res.status(400).type('text').send('The message field is required.');
    }
    try {
      const reply = await chatService.chat(req.body.message, req.file);
      res.type('text').send(reply);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/chat', async (req, res, next) => {
    try {
      await chatService.clearHistory();
      res.status(200).end();
    } catch (error) {
      next(error);
    }
  });

  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).type('text').send(
        status === 413 ? 'Maximum image size is 10 MB.' : 'Invalid multipart upload.',
      );
    }
    if (error.status === 400) {
      return res.status(400).type('text').send(error.message);
    }
    // Avoid exposing credentials or provider internals to the frontend.
    res.status(502).type('text').send('Unable to get an AI response. Check your API key and try again.');
  });
  return app;
}
