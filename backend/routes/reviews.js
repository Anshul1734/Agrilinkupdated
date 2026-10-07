import express from 'express';
import { authenticate, loadProfile, requireRole } from '../middleware/auth.js';
import { badRequest, conflict, dbError, notFound, wrap } from '../lib/errors.js';
import { parse, reviewCreate, reviewQuery } from '../lib/schemas.js';

const isId = (v) => /^\d{1,15}$/.test(v);

// Never expose reviewerId (a Firebase UID) publicly.
const publicReview = (r) => ({ id: r.id, productId: r.productId, reviewerName: r.reviewerName, rating: r.rating, comment: r.comment, created_at: r.created_at });

export default function reviewRoutes({ supabase, verify }) {
  const router = express.Router();
  const auth = authenticate(verify);
  const buyer = [auth, loadProfile(supabase), requireRole('Buyer')];

  router.get(
    '/',
    wrap(async (req, res) => {
      const f = parse(reviewQuery, req.query);
      const { data, error, count } = await supabase
        .from('Review')
        .select('*', { count: 'exact' })
        .eq('productId', f.productId)
        .order('created_at', { ascending: false })
        .range(f.offset, f.offset + f.limit - 1);
      if (error) throw dbError(error, 'list reviews');
      res.json({ items: data.map(publicReview), total: count ?? data.length });
    }),
  );

  // The caller's own reviews, with product names for display.
  router.get(
    '/mine',
    ...buyer,
    wrap(async (req, res) => {
      const { data, error } = await supabase.from('Review').select('*').eq('reviewerId', req.auth.uid).order('created_at', { ascending: false });
      if (error) throw dbError(error, 'list own reviews');
      const ids = [...new Set(data.map((r) => r.productId))];
      let names = new Map();
      if (ids.length) {
        const { data: prods, error: pe } = await supabase.from('Product').select('id,name,imageUrl').in('id', ids);
        if (pe) throw dbError(pe, 'lookup reviewed products');
        names = new Map(prods.map((p) => [p.id, p]));
      }
      res.json({ items: data.map((r) => ({ ...publicReview(r), productName: names.get(r.productId)?.name ?? 'Removed product', productImage: names.get(r.productId)?.imageUrl ?? null })) });
    }),
  );

  // Delivered lines of this product that the caller hasn't reviewed yet: i.e. what they may review now.
  router.get(
    '/eligible',
    ...buyer,
    wrap(async (req, res) => {
      const { productId } = parse(reviewQuery.pick({ productId: true }), req.query);
      const { data, error } = await supabase.rpc('eligible_review_items', { p_buyer_id: req.auth.uid, p_product_id: productId });
      if (error) throw dbError(error, 'list eligible review items');
      res.json({ items: data.map((r) => ({ orderItemId: r.orderItemId, orderId: r.orderId })) });
    }),
  );

  router.post(
    '/',
    ...buyer,
    wrap(async (req, res) => {
      const body = parse(reviewCreate, req.body);
      const { data, error } = await supabase.rpc('submit_review', {
        p_item_id: body.orderItemId,
        p_buyer_id: req.auth.uid,
        p_buyer_name: req.profile.name,
        p_rating: body.rating,
        p_comment: body.comment,
      });
      if (error) {
        const msg = error.message || '';
        // Two simultaneous submissions: the UNIQUE(orderItemId) constraint catches the loser.
        if (error.code === '23505') throw conflict('You have already reviewed this purchase.');
        if (msg.startsWith('not_found')) throw notFound('Order item not found');
        if (msg.startsWith('not_delivered')) throw conflict('You can review an item once it has been delivered.');
        if (msg.startsWith('already_reviewed')) throw conflict('You have already reviewed this purchase.');
        if (msg.startsWith('product_gone')) throw conflict('This product is no longer listed.');
        if (msg.startsWith('invalid_rating')) throw badRequest('rating: Choose 1 to 5 stars');
        throw dbError(error, 'submit review');
      }
      res.status(201).json(publicReview(data));
    }),
  );

  router.delete(
    '/:id',
    ...buyer,
    wrap(async (req, res) => {
      if (!isId(req.params.id)) throw notFound('Review not found');
      const { error } = await supabase.rpc('delete_review', { p_review_id: req.params.id, p_buyer_id: req.auth.uid });
      if (error) {
        if ((error.message || '').startsWith('not_found')) throw notFound('Review not found');
        throw dbError(error, 'delete review');
      }
      res.status(204).end();
    }),
  );

  return router;
}

