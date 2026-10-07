import express from 'express';
import { randomUUID } from 'node:crypto';
import { authenticate, loadProfile, requireRole } from '../middleware/auth.js';
import { ApiError, badRequest, dbError, wrap } from '../lib/errors.js';

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const BUCKET = 'product-images';
/** Per-farmer cap on stored photos. Rate limits slow abuse; this bounds it. */
export const MAX_FILES_PER_FARMER = 200;

/** Identify the real image type from the file's first bytes. The client-supplied Content-Type is never trusted. */
export function sniffImage(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { type: 'image/png', ext: 'png' };
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { type: 'image/webp', ext: 'webp' };
  return null;
}

export default function uploadRoutes({ supabase, verify }) {
  const router = express.Router();

  router.post(
    '/product-image',
    authenticate(verify),
    loadProfile(supabase),
    requireRole('Farmer'),
    // Raw bytes, not multipart: no parser surface to attack. The limit is enforced while streaming.
    express.raw({ type: () => true, limit: MAX_IMAGE_BYTES }),
    wrap(async (req, res) => {
      const body = req.body;
      if (!Buffer.isBuffer(body) || body.length === 0) throw badRequest('Send the image file as the request body.');
      const kind = sniffImage(body);
      if (!kind) throw badRequest('Only JPEG, PNG or WebP images are allowed.');

      const { data: existing, error: listError } = await supabase.storage.from(BUCKET).list(req.auth.uid, { limit: MAX_FILES_PER_FARMER + 1 });
      if (listError) throw dbError(listError, 'count product images');
      if (existing.length >= MAX_FILES_PER_FARMER) throw new ApiError(409, `You've reached the limit of ${MAX_FILES_PER_FARMER} photos. Remove unused products before uploading more.`, 'quota');

      // Files live under the uploader's uid and get an unguessable name, so nothing can be overwritten.
      const path = `${req.auth.uid}/${randomUUID()}.${kind.ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType: kind.type, upsert: false });
      if (error) throw dbError(error, 'upload product image');
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      res.status(201).json({ url: data.publicUrl });
    }),
  );

  return router;
}

