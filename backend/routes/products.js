import express from 'express';
import { authenticate, loadProfile, requireRole } from '../middleware/auth.js';
import { badRequest, dbError, notFound, wrap } from '../lib/errors.js';
import { PRODUCTION_TYPES, parse, productCreate, productQuery, productUpdate, stockUpdate } from '../lib/schemas.js';

const isId = (v) => /^\d{1,15}$/.test(v);

/** Free text goes into a PostgREST filter string, so keep letters/digits/spaces only. */
const safeSearch = (q) => q.replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();

export default function productRoutes({ supabase, verify }) {
  const router = express.Router();
  const auth = authenticate(verify);
  const farmer = [auth, loadProfile(supabase), requireRole('Farmer')];

  // Public catalogue with server-side filtering, sorting and pagination.
  router.get(
    '/',
    wrap(async (req, res) => {
      const f = parse(productQuery, req.query);
      let query = supabase.from('Product').select('*', { count: 'exact' });

      if (f.ids) query = query.in('id', f.ids.split(',').map(Number));

      const categoryIds = f.categoryIds ? f.categoryIds.split(',').map(Number) : f.categoryId ? [f.categoryId] : [];
      if (categoryIds.length) query = query.in('categoryId', categoryIds);

      if (f.productionType) {
        const types = f.productionType.split(',').filter((t) => PRODUCTION_TYPES.includes(t));
        if (types.length) query = query.in('productionType', types);
      }
      if (f.sellerId) query = query.eq('sellerId', f.sellerId);
      if (f.minPrice !== undefined) query = query.gte('price', f.minPrice);
      if (f.maxPrice !== undefined) query = query.lte('price', f.maxPrice);
      if (f.inStock === 'true') query = query.gt('quantityAvailable', 0);

      if (f.q) {
        const term = safeSearch(f.q);
        if (term) query = query.or(`name.ilike.*${term}*,description.ilike.*${term}*,categoryName.ilike.*${term}*`);
      }

      if (f.sort === 'price_asc') query = query.order('price', { ascending: true });
      else if (f.sort === 'price_desc') query = query.order('price', { ascending: false });
      else query = query.order('created_at', { ascending: false });
      query = query.order('id', { ascending: true }).range(f.offset, f.offset + f.limit - 1);

      const { data, error, count } = await query;
      if (error) throw dbError(error, 'list products');
      res.json({ items: data, total: count ?? data.length });
    }),
  );

  // The signed-in farmer's own listings (including sold-out ones).
  router.get(
    '/mine',
    ...farmer,
    wrap(async (req, res) => {
      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('sellerId', req.auth.uid)
        .order('created_at', { ascending: false });
      if (error) throw dbError(error, 'list own products');
      res.json({ items: data, total: data.length });
    }),
  );

  router.get(
    '/:id',
    wrap(async (req, res) => {
      if (!isId(req.params.id)) throw notFound('Product not found');
      const { data, error } = await supabase.from('Product').select('*').eq('id', req.params.id).maybeSingle();
      if (error) throw dbError(error, 'get product');
      if (!data) throw notFound('Product not found');
      res.json(data);
    }),
  );

  router.post(
    '/',
    ...farmer,
    wrap(async (req, res) => {
      const body = parse(productCreate, req.body);
      const categoryName = await categoryNameFor(supabase, body.categoryId);

      const { data, error } = await supabase
        .from('Product')
        .insert({
          ...body,
          categoryName,
          // Identity always comes from the verified token, never from the request body.
          sellerId: req.auth.uid,
          sellerName: req.profile.name,
          inStock: body.quantityAvailable > 0,
        })
        .select()
        .single();
      if (error) throw dbError(error, 'create product');
      res.status(201).json(data);
    }),
  );

  const update = (getBody) =>
    wrap(async (req, res) => {
      if (!isId(req.params.id)) throw notFound('Product not found');
      const body = getBody(req);
      const patch = { ...body };
      if (body.categoryId !== undefined) patch.categoryName = await categoryNameFor(supabase, body.categoryId);
      if (body.quantityAvailable !== undefined) patch.inStock = body.quantityAvailable > 0;

      // Ownership is part of the WHERE clause, so there is no check-then-act gap.
      const { data, error } = await supabase
        .from('Product')
        .update(patch)
        .eq('id', req.params.id)
        .eq('sellerId', req.auth.uid)
        .select()
        .maybeSingle();
      if (error) throw dbError(error, 'update product');
      if (!data) throw notFound('Product not found');
      res.json(data);
    });

  router.patch('/:id', ...farmer, update((req) => parse(productUpdate, req.body)));
  router.put(
    '/:id/stock',
    ...farmer,
    update((req) => parse(stockUpdate, req.body)),
  );

  router.delete(
    '/:id',
    ...farmer,
    wrap(async (req, res) => {
      if (!isId(req.params.id)) throw notFound('Product not found');
      const { data, error } = await supabase
        .from('Product')
        .delete()
        .eq('id', req.params.id)
        .eq('sellerId', req.auth.uid)
        .select('id');
      if (error) throw dbError(error, 'delete product');
      if (!data.length) throw notFound('Product not found');
      res.status(204).end();
    }),
  );

  return router;
}

async function categoryNameFor(supabase, id) {
  const { data, error } = await supabase.from('Category').select('name').eq('id', id).maybeSingle();
  if (error) throw dbError(error, 'lookup category');
  if (!data) throw badRequest('categoryId: Unknown category');
  return data.name;
}
