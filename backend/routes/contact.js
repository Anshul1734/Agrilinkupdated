import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { dbError, wrap } from '../lib/errors.js';
import { contactCreate, parse } from '../lib/schemas.js';

export default function contactRoutes({ supabase, limits = {} }) {
  const router = express.Router();
  // Public and unauthenticated, so it gets its own tight limit.
  router.use(rateLimit({ windowMs: 60 * 60 * 1000, limit: limits.contact ?? 5, standardHeaders: 'draft-7', legacyHeaders: false }));

  router.post(
    '/',
    wrap(async (req, res) => {
      const { website, ...msg } = parse(contactCreate, req.body);
      if (website) return res.status(204).end(); // bot: pretend it worked, store nothing
      const { error } = await supabase.from('ContactMessage').insert(msg);
      if (error) throw dbError(error, 'save contact message');
      res.status(204).end();
    }),
  );

  return router;
}
