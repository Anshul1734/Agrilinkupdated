import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { dbError, notFound, wrap } from '../lib/errors.js';

const isId = (v) => /^\d{1,15}$/.test(v);

export default function notificationRoutes({ supabase, verify }) {
  const router = express.Router();
  router.use(authenticate(verify));

  router.get(
    '/',
    wrap(async (req, res) => {
      const uid = req.auth.uid;
      const { data, error } = await supabase.from('Notification').select('*').eq('userId', uid).order('created_at', { ascending: false }).range(0, 29);
      if (error) throw dbError(error, 'list notifications');
      const { count, error: ce } = await supabase.from('Notification').select('id', { count: 'exact' }).eq('userId', uid).eq('read', false).range(0, 0);
      if (ce) throw dbError(ce, 'count unread notifications');
      res.json({ items: data.map(({ userId, ...n }) => n), unread: count ?? 0 });
    }),
  );

  router.post(
    '/read-all',
    wrap(async (req, res) => {
      const { error } = await supabase.from('Notification').update({ read: true }).eq('userId', req.auth.uid).eq('read', false);
      if (error) throw dbError(error, 'mark all read');
      res.status(204).end();
    }),
  );

  router.patch(
    '/:id/read',
    wrap(async (req, res) => {
      if (!isId(req.params.id)) throw notFound('Notification not found');
      const { data, error } = await supabase.from('Notification').update({ read: true }).eq('id', req.params.id).eq('userId', req.auth.uid).select('id');
      if (error) throw dbError(error, 'mark read');
      if (!data.length) throw notFound('Notification not found');
      res.status(204).end();
    }),
  );

  return router;
}
