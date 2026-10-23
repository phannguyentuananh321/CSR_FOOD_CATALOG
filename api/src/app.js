import express from 'express';
import { config } from './config.js';
import { corsMiddleware, errorHandler, notFoundHandler } from './middleware/http.js';
import chefsRouter from './routes/chefs.js';
import dishesRouter from './routes/dishes.js';
import ingredientsRouter from './routes/ingredients.js';
import uploadsRouter from './routes/uploads.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '1mb' }));

  // Ảnh lưu ở đĩa cục bộ (chế độ dev không có Supabase) được phục vụ tĩnh.
  app.use('/uploads', express.static(config.uploadDir, { fallthrough: true, maxAge: '7d' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, data: { status: 'up', time: new Date().toISOString() } });
  });

  app.use('/api/dishes', dishesRouter);
  app.use('/api/chefs', chefsRouter);
  app.use('/api/ingredients', ingredientsRouter);
  app.use('/api/uploads', uploadsRouter);

  app.use('/api', notFoundHandler);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
