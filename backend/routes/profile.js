import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { conflict, dbError, notFound, wrap } from '../lib/errors.js';
import { parse, profileCreate, profileUpdate } from '../lib/schemas.js';

export default function profileRoutes({ supabase, verify }) {
  const router = express.Router();
  router.use(authenticate(verify));

  router.get(
    '/',
    wrap(async (req, res) => {
      const { data, error } = await supabase.from('Profile').select('*').eq('uid', req.auth.uid).maybeSingle();
      if (error) throw dbError(error, 'get profile');
      if (!data) {
        const err = notFound('No profile yet');
        err.code = 'profile_required';
        throw err;
      }
      res.json(data);
    }),
  );

  // Role is chosen once, here, and cannot be changed afterwards.
  router.post(
    '/',
    wrap(async (req, res) => {
      const body = parse(profileCreate, req.body);
      if (body.role === 'Farmer' && !body.terrain) {
        const err = new Error('terrain: Please select your terrain type');
        err.status = 400;
        throw err;
      }
      const row = { uid: req.auth.uid, email: req.auth.email ?? null, ...body };
      if (body.role !== 'Farmer') delete row.terrain;

      const { data, error } = await supabase.from('Profile').insert(row).select().single();
      if (error?.code === '23505') throw conflict('Profile already exists');
      if (error) throw dbError(error, 'create profile');
      res.status(201).json(data);
    }),
  );

  router.patch(
    '/',
    wrap(async (req, res) => {
      const body = parse(profileUpdate, req.body);
      if (body.terrain !== undefined) {
        const { data: me } = await supabase.from('Profile').select('role').eq('uid', req.auth.uid).maybeSingle();
        if (me?.role !== 'Farmer') delete body.terrain;
      }
      if (Object.keys(body).length === 0) return res.json(await currentProfile(supabase, req.auth.uid));
      const { data, error } = await supabase.from('Profile').update(body).eq('uid', req.auth.uid).select().maybeSingle();
      if (error) throw dbError(error, 'update profile');
      if (!data) throw notFound('No profile yet');
      res.json(data);
    }),
  );

  return router;
}

async function currentProfile(supabase, uid) {
  const { data } = await supabase.from('Profile').select('*').eq('uid', uid).maybeSingle();
  return data;
}
