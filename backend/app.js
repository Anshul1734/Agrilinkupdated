import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { config, missingConfig } from './config.js';
import { createSupabase } from './supabaseClient.js';
import { createFirebaseVerifier } from './lib/firebaseVerifier.js';
import { ApiError } from './lib/errors.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import profileRoutes from './routes/profile.js';
import contactRoutes from './routes/contact.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/uploads.js';

/**
 * Builds the Express app. `supabase` and `verify` are injectable so the API can be
 * tested without a database or real Firebase tokens.
 */
export function createApp({ supabase, verify, limits = {} } = {}) {
  const { general = 600, writes = 30 } = limits;
  const app = express();
  app.set('trust proxy', 1); // behind Vercel / a reverse proxy: needed for per-client rate limiting
  app.disable('x-powered-by');

  app.use(helmet());
  if (config.corsOrigins.length) app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '20kb' }));

  // Responses can contain a user's private data, so nothing under /api is cached by browsers or CDNs
  // unless a route opts in (the public category list does).
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: missingConfig.length && !supabase ? 'misconfigured' : 'ok' });
  });

  // Public settings the UI needs to display (the server stays the source of truth for what is charged).
  app.get('/api/config', (_req, res) => res.json({ shippingPerFarmer: config.shippingPerFarmer, paymentMethod: 'COD' }));

  if (!supabase && missingConfig.length) {
    console.error(`[config] Missing environment variables: ${missingConfig.join(', ')}`);
    app.use('/api', (_req, res) => res.status(503).json({ error: 'The server is not configured yet.' }));
  } else {
    const deps = {
      supabase: supabase ?? createSupabase(),
      verify: verify ?? createFirebaseVerifier(config.firebaseProjectId),
    };

    app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: general, standardHeaders: 'draft-7', legacyHeaders: false }));
    // Writes are stricter. (In-memory counters are per serverless instance - see README.)
    const writeLimit = rateLimit({ windowMs: 60 * 1000, limit: writes, standardHeaders: 'draft-7', legacyHeaders: false });
    app.use('/api', (req, res, next) => (req.method === 'GET' ? next() : writeLimit(req, res, next)));

    app.use('/api/categories', categoryRoutes(deps));
    app.use('/api/products', productRoutes(deps));
    app.use('/api/orders', orderRoutes(deps));
    app.use('/api/profile', profileRoutes(deps));
    app.use('/api/contact', contactRoutes({ ...deps, limits }));
    app.use('/api/reviews', reviewRoutes(deps));
    app.use('/api/notifications', notificationRoutes(deps));
    app.use('/api/uploads', uploadRoutes(deps));
  }

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
    // Our own ApiErrors carry curated, safe messages at any status (e.g. 503 "try again"). Anything else with a 5xx
    // status is an unexpected failure whose details must not leave the server.
    if (err instanceof ApiError || (err.status && err.status < 500)) return res.status(err.status).json({ error: err.message, code: err.code });
    console.error('[unhandled]', err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });

  return app;
}
