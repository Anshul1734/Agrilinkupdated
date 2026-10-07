import express from 'express';
import { dbError, wrap } from '../lib/errors.js';

export default function categoryRoutes({ supabase }) {
  const router = express.Router();

  router.get(
    '/',
    wrap(async (_req, res) => {
      const { data, error } = await supabase.from('Category').select('*').order('id');
      if (error) throw dbError(error, 'list categories');

      // productCount in the table is a stale seed value; compute the real one in SQL (no row cap).
      const { data: rows, error: countError } = await supabase.rpc('category_counts');
      if (countError) throw dbError(countError, 'count products');
      const counts = new Map(rows.map((r) => [r.categoryId, r.n]));

      res.set('Cache-Control', 'public, max-age=60');
      res.json(data.map((c) => ({ ...c, productCount: counts.get(c.id) || 0 })));
    }),
  );

  return router;
}
