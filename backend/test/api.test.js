import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import { createFakeSupabase } from './fakeSupabase.js';

const seed = {
  ContactMessage: [],
  Review: [{ id: 1, productId: 1, orderItemId: 50, reviewerId: 'buyer1', reviewerName: 'Buyer One', rating: 5, comment: 'Great', created_at: '2025-03-01' }],
  Notification: [
    { id: 1, userId: 'buyer1', type: 'order_status', title: 'Order #1 update', body: 'x', link: '/order/1', read: false, created_at: '2025-03-02' },
    { id: 2, userId: 'buyer1', type: 'order_status', title: 'Old', body: 'y', link: '/order/1', read: true, created_at: '2025-03-01' },
    { id: 3, userId: 'farmerA', type: 'order_placed', title: 'New order', body: 'z', link: '/order/1', read: false, created_at: '2025-03-03' },
  ],
  Category: [{ id: 1, name: 'Vegetables' }, { id: 2, name: 'Fruits' }],
  Profile: [
    { uid: 'farmerA', name: 'Farm A', role: 'Farmer', address: 'a' },
    { uid: 'farmerB', name: 'Farm B', role: 'Farmer', address: 'b' },
    { uid: 'buyer1', name: 'Buyer One', role: 'Buyer', address: '1 Main St', contactNumber: '555' },
    { uid: 'buyerNoAddr', name: 'No Addr', role: 'Buyer', address: '' },
  ],
  Product: [
    { id: 1, name: 'Tomato', price: 2.5, quantityAvailable: 10, sellerId: 'farmerA', categoryId: 1, categoryName: 'Vegetables', productionType: 'Organic', created_at: '2025-01-01' },
    { id: 2, name: 'Apple', price: 1.9, quantityAvailable: 0, sellerId: 'farmerB', categoryId: 2, categoryName: 'Fruits', productionType: 'Traditional', created_at: '2025-01-02' },
  ],
  Order: [{ id: 2, buyerId: 'buyer1', buyerName: 'Buyer One', totalAmount: 5, shippingAmount: 0, shippingAddress: 'a', created_at: '2025-01-05' }, { id: 1, buyerId: 'buyer1', buyerName: 'Buyer One', totalAmount: 15, shippingAmount: 5, shippingAddress: '1 Main St', created_at: '2025-02-01' }],
  OrderItem: [
    { id: 50, orderId: 2, productId: 1, productName: 'Tomato', unitPrice: 2.5, quantity: 1, sellerId: 'farmerA', status: 'Delivered' },
    { id: 51, orderId: 2, productId: 1, productName: 'Tomato', unitPrice: 2.5, quantity: 1, sellerId: 'farmerA', status: 'Delivered' },
    { id: 52, orderId: 2, productId: 2, productName: 'Apple', unitPrice: 1.9, quantity: 1, sellerId: 'farmerB', status: 'Delivered' },
    { id: 1, orderId: 1, productId: 1, productName: 'Tomato', unitPrice: 2.5, quantity: 2, sellerId: 'farmerA', status: 'Pending' },
    { id: 2, orderId: 1, productId: 2, productName: 'Apple', unitPrice: 1.9, quantity: 3, sellerId: 'farmerB', status: 'Shipped' },
  ],
};

let server, base, fake;
const verify = async (token) => {
  if (token === 'tok-infra-down') throw Object.assign(new TypeError('fetch failed'), { code: 'ERR_JWKS_TIMEOUT' });
  if (!token.startsWith('tok-')) throw Object.assign(new Error('bad token'), { code: 'ERR_JWT_INVALID' });
  return { uid: token.slice(4), email: `${token.slice(4)}@x.com` };
};

before(async () => {
  fake = createFakeSupabase(seed, {
    place_order: async (args, db) => {
      db.Order.push({ id: 99, buyerId: args.p_buyer_id, buyerName: args.p_buyer_name, totalAmount: 0, shippingAmount: args.p_shipping });
      return { data: 99, error: null };
    },
    category_counts: async (_a, db) => {
      const m = new Map();
      for (const p of db.Product) if (p.quantityAvailable > 0) m.set(p.categoryId, (m.get(p.categoryId) || 0) + 1);
      return { data: [...m].map(([categoryId, n]) => ({ categoryId, n })), error: null };
    },
    eligible_review_items: async (a, db) => {
      const mine = db.Order.filter((o) => o.buyerId === a.p_buyer_id).map((o) => o.id);
      const rows = db.OrderItem.filter((i) => mine.includes(i.orderId) && i.productId === a.p_product_id && i.status === 'Delivered' && !db.Review.some((r) => r.orderItemId === i.id));
      return { data: rows.map((i) => ({ orderItemId: i.id, orderId: i.orderId })), error: null };
    },
    order_stats: async (a) => ({ data: { forUser: a.p_user_id, role: a.p_role, orders: 7 }, error: null }),
    submit_review: async (a, db) => {
      if (a.p_item_id === 777) return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
      const item = db.OrderItem.find((i) => i.id === a.p_item_id);
      const order = item && db.Order.find((o) => o.id === item.orderId);
      if (!item || order.buyerId !== a.p_buyer_id) return { data: null, error: { message: 'not_found' } };
      if (item.status !== 'Delivered') return { data: null, error: { message: 'not_delivered' } };
      if (db.Review.some((r) => r.orderItemId === item.id)) return { data: null, error: { message: 'already_reviewed' } };
      const r = { id: db.Review.length + 1, productId: item.productId, orderItemId: item.id, reviewerId: a.p_buyer_id, reviewerName: a.p_buyer_name, rating: a.p_rating, comment: a.p_comment, created_at: new Date().toISOString() };
      db.Review.push(r);
      return { data: r, error: null };
    },
    delete_review: async (a, db) => {
      const i = db.Review.findIndex((r) => r.id === Number(a.p_review_id) && r.reviewerId === a.p_buyer_id);
      if (i < 0) return { data: null, error: { message: 'not_found' } };
      db.Review.splice(i, 1);
      return { data: null, error: null };
    },
    update_order_item_status: async (args) => ({ data: { id: Number(args.p_item_id), status: args.p_new_status }, error: null }),
  });
  const app = createApp({ supabase: fake, verify, limits: { writes: 10_000 } });
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const call = async (method, path, { as, body, headers } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(as ? { authorization: `Bearer tok-${as}` } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
};

// ---------- public catalogue ----------
test('GET /products is public and filters', async () => {
  const all = await call('GET', '/api/products');
  assert.equal(all.status, 200);
  assert.equal(all.body.total, 2);
  const inStock = await call('GET', '/api/products?inStock=true');
  assert.deepEqual(inStock.body.items.map((p) => p.id), [1]);
  const byType = await call('GET', '/api/products?productionType=Organic');
  assert.deepEqual(byType.body.items.map((p) => p.id), [1]);
  const sorted = await call('GET', '/api/products?sort=price_asc');
  assert.deepEqual(sorted.body.items.map((p) => p.id), [2, 1]);
});

test('search input is stripped of PostgREST filter syntax', async () => {
  fake.calls.length = 0;
  await call('GET', '/api/products?q=' + encodeURIComponent('x),sellerId.neq.0,name.ilike.*('));
  const expr = fake.calls.find((c) => c.or).or;
  // every filter-syntax character is gone, so the term can't add or alter filters
  assert.equal(expr.match(/\*([^*]*)\*/)[1], 'x sellerId neq 0 name ilike');
  assert.equal(expr.split(',').length, 3, 'still exactly three conditions: ' + expr);
});

test('invalid query params are rejected with 400, not passed to the database', async () => {
  assert.equal((await call('GET', '/api/products?limit=100000')).status, 400);
  assert.equal((await call('GET', '/api/products?ids=1;drop')).status, 400);
  assert.equal((await call('GET', '/api/products?sort=evil')).status, 400);
});

test('GET /products/:id: 404 for unknown and non-numeric ids', async () => {
  assert.equal((await call('GET', '/api/products/1')).status, 200);
  assert.equal((await call('GET', '/api/products/999')).status, 404);
  assert.equal((await call('GET', '/api/products/abc')).status, 404);
});

// ---------- authentication ----------
test('write and private endpoints require a valid token', async () => {
  for (const [m, p] of [['POST', '/api/products'], ['GET', '/api/orders'], ['POST', '/api/orders'], ['GET', '/api/profile'], ['GET', '/api/products/mine']]) {
    const r = await call(m, p, { body: m === 'POST' ? {} : undefined });
    assert.equal(r.status, 401, `${m} ${p}`);
  }
  const bad = await call('GET', '/api/orders', { headers: { authorization: 'Bearer garbage' } });
  assert.equal(bad.status, 401);
});

test('a signed-in user with no profile gets profile_required', async () => {
  const r = await call('GET', '/api/orders', { as: 'newcomer' });
  assert.equal(r.status, 403);
  assert.equal(r.body.code, 'profile_required');
});

// ---------- products: roles + ownership ----------
const goodProduct = { name: 'Carrot', price: 1.5, quantityAvailable: 20, unit: 'kg', productionType: 'Organic', categoryId: 1 };

test('buyers cannot create products', async () => {
  assert.equal((await call('POST', '/api/products', { as: 'buyer1', body: goodProduct })).status, 403);
});

test('farmer creates a product; identity comes from the token, not the body', async () => {
  const r = await call('POST', '/api/products', { as: 'farmerA', body: { ...goodProduct, sellerId: 'farmerB', sellerName: 'Hacker', rating: 5, id: 1 } });
  assert.equal(r.status, 201);
  assert.equal(r.body.sellerId, 'farmerA');
  assert.equal(r.body.sellerName, 'Farm A');
  assert.equal(r.body.categoryName, 'Vegetables');
  assert.equal(r.body.inStock, true);
  assert.equal(r.body.rating, undefined, 'unknown fields are not persisted');
});

test('product validation', async () => {
  const bad = [
    { ...goodProduct, price: -1 },
    { ...goodProduct, price: 1.234 },
    { ...goodProduct, quantityAvailable: 1.5 },
    { ...goodProduct, unit: 'tonne-of-bricks' },
    { ...goodProduct, imageUrl: 'javascript:alert(1)' },
    { ...goodProduct, imageUrl: 'http://insecure.example/x.jpg' },
    { ...goodProduct, categoryId: 999 },
    { ...goodProduct, name: 'x' },
  ];
  for (const body of bad) assert.equal((await call('POST', '/api/products', { as: 'farmerA', body })).status, 400, JSON.stringify(body));
});

test('malformed and oversized JSON bodies', async () => {
  assert.equal((await call('POST', '/api/products', { as: 'farmerA', body: '{not json' })).status, 400);
  assert.equal((await call('POST', '/api/products', { as: 'farmerA', body: { ...goodProduct, description: 'x'.repeat(30000) } })).status, 413);
});

test("a farmer cannot edit or delete another farmer's product", async () => {
  assert.equal((await call('PUT', '/api/products/2/stock', { as: 'farmerA', body: { quantityAvailable: 9999 } })).status, 404);
  assert.equal((await call('PATCH', '/api/products/2', { as: 'farmerA', body: { price: 0.01 } })).status, 404);
  assert.equal((await call('DELETE', '/api/products/2', { as: 'farmerA' })).status, 404);
  assert.equal(fake.db.Product.find((p) => p.id === 2).price, 1.9, 'price untouched');
});

test('owner can update stock (inStock derived) and delete', async () => {
  const up = await call('PUT', '/api/products/2/stock', { as: 'farmerB', body: { quantityAvailable: 7, inStock: false } });
  assert.equal(up.status, 200);
  assert.equal(up.body.quantityAvailable, 7);
  assert.equal(up.body.inStock, true, 'client cannot set inStock directly');
  assert.equal((await call('DELETE', '/api/products/2', { as: 'farmerB' })).status, 204);
  assert.equal((await call('GET', '/api/products/2')).status, 404);
});

// ---------- profile ----------
test('profile: create once, role is immutable', async () => {
  const mk = (b) => call('POST', '/api/profile', { as: 'fresh', body: b });
  assert.equal((await mk({ name: 'Fresh', role: 'Admin' })).status, 400);
  assert.equal((await mk({ name: 'Fresh', role: 'Farmer' })).status, 400, 'farmer needs terrain');
  const ok = await mk({ name: 'Fresh', role: 'Farmer', terrain: 'Hills', address: 'Somewhere' });
  assert.equal(ok.status, 201);
  assert.equal((await mk({ name: 'Fresh', role: 'Buyer' })).status, 409);
  const patch = await call('PATCH', '/api/profile', { as: 'fresh', body: { name: 'Renamed', role: 'Buyer', uid: 'x' } });
  assert.equal(patch.status, 200);
  assert.equal(patch.body.role, 'Farmer');
  assert.equal(patch.body.uid, 'fresh');
});

// ---------- orders ----------
test('farmers cannot place orders; buyers need a delivery address', async () => {
  assert.equal((await call('POST', '/api/orders', { as: 'farmerA', body: { items: [{ productId: 1, quantity: 1 }] } })).status, 403);
  const r = await call('POST', '/api/orders', { as: 'buyerNoAddr', body: { items: [{ productId: 1, quantity: 1 }] } });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /address/i);
});

test('order body is validated and the client cannot supply prices or totals', async () => {
  for (const body of [{}, { items: [] }, { items: [{ productId: 1, quantity: 0 }] }, { items: [{ productId: 1, quantity: -5 }] }, { items: [{ productId: '1; drop', quantity: 1 }] }]) {
    assert.equal((await call('POST', '/api/orders', { as: 'buyer1', body })).status, 400, JSON.stringify(body));
  }
  fake.calls.length = 0;
  await call('POST', '/api/orders', { as: 'buyer1', body: { items: [{ productId: 1, quantity: 2, price: 0.01 }], totalAmount: 0.01, buyerId: 'farmerA' } });
  const rpc = fake.calls.find((c) => c.rpc === 'place_order').args;
  assert.equal(rpc.p_buyer_id, 'buyer1', 'buyer comes from token');
  assert.deepEqual(rpc.p_items, [{ productId: 1, quantity: 2 }], 'only ids + quantities are forwarded');
  assert.equal(rpc.p_shipping_per_seller, 40);
});

test('rate limiting kicks in on write endpoints', async () => {
  const app = createApp({ supabase: createFakeSupabase(seed), verify, limits: { writes: 3 } });
  const s = await new Promise((r) => { const x = app.listen(0, () => r(x)); });
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await fetch(`http://127.0.0.1:${s.address().port}/api/orders`, { method: 'POST' })).status);
  s.close();
  assert.deepEqual(codes, [401, 401, 401, 429, 429]);
});

test('order visibility: buyer sees all lines, each farmer only theirs, strangers nothing', async () => {
  const buyer = await call('GET', '/api/orders/1', { as: 'buyer1' });
  assert.equal(buyer.status, 200);
  assert.equal(buyer.body.items.length, 2);
  const a = await call('GET', '/api/orders/1', { as: 'farmerA' });
  assert.deepEqual(a.body.items.map((i) => i.sellerId), ['farmerA']);
  assert.equal(a.body.itemsSubtotal, 5);
  const stranger = await call('GET', '/api/orders/1', { as: 'buyerNoAddr' });
  assert.equal(stranger.status, 404);
  const otherFarmer = await call('GET', '/api/orders/1', { as: 'fresh' });
  assert.equal(otherFarmer.status, 404);
});

test('order list is scoped to the caller', async () => {
  const mine = await call('GET', '/api/orders', { as: 'buyer1' });
  assert.equal(mine.body.items.length, 2);
  assert.equal((await call('GET', '/api/orders', { as: 'buyerNoAddr' })).body.items.length, 0);
  const sales = await call('GET', '/api/orders', { as: 'farmerA' });
  assert.equal(sales.body.items.length, 2);
  assert.equal(sales.body.items[0].items.every((i) => i.sellerId === 'farmerA'), true);
  assert.equal((await call('GET', '/api/orders', { as: 'farmerB' })).body.items[0].status, 'Shipped');
});

test('item status: validated, mapped to friendly errors, actor comes from the token', async () => {
  assert.equal((await call('PATCH', '/api/orders/items/1/status', { as: 'farmerA', body: { status: 'Teleported' } })).status, 400);
  fake.calls.length = 0;
  const ok = await call('PATCH', '/api/orders/items/1/status', { as: 'farmerA', body: { status: 'Processing', actor: 'someone' } });
  assert.equal(ok.status, 200);
  assert.equal(fake.calls.find((c) => c.rpc).args.p_actor_id, 'farmerA');
});

// ---------- misc hardening ----------
test('security headers and no framework banner', async () => {
  const r = await call('GET', '/api/health');
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
});

test('contact form: validated, stored, honeypot ignored, rate limited', async () => {
  const app = createApp({ supabase: fake, verify, limits: { writes: 10_000, contact: 5 } });
  const s = await new Promise((r) => { const x = app.listen(0, () => r(x)); });
  const post = (body) => fetch(`http://127.0.0.1:${s.address().port}/api/contact`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  try {
  const good = { name: 'Asha', email: 'asha@example.com', message: 'Hello, I would like to sell honey.' };
  assert.equal((await post({ ...good, email: 'nope' })).status, 400);
  assert.equal((await post({ ...good, message: 'hi' })).status, 400);
  const before = fake.db.ContactMessage.length;
  assert.equal((await post(good)).status, 204);
  assert.equal(fake.db.ContactMessage.length, before + 1);
  assert.equal((await post({ ...good, website: 'http://spam.example' })).status, 204);
  assert.equal(fake.db.ContactMessage.length, before + 1, 'honeypot submissions are not stored');
  assert.equal(fake.db.ContactMessage.at(-1).website, undefined);
  assert.equal((await post(good)).status, 204, 'fifth request (rejected ones count too) is the last allowed');
  assert.equal((await post(good)).status, 429, 'sixth request in the hour is blocked');
  } finally { s.close(); }
});

test('unknown API routes return JSON 404', async () => {
  const r = await call('GET', '/api/nope');
  assert.equal(r.status, 404);
  assert.equal(r.body.error, 'Not found');
});

test('database errors never leak internals', async () => {
  const boom = createFakeSupabase();
  boom.from = () => { throw new Error('connection to db.internal:5432 refused, password=hunter2'); };
  const app = createApp({ supabase: boom, verify });
  const s = await new Promise((r) => { const x = app.listen(0, () => r(x)); });
  const res = await fetch(`http://127.0.0.1:${s.address().port}/api/categories`);
  const text = await res.text();
  s.close();
  assert.equal(res.status, 500);
  assert.ok(!text.includes('hunter2') && !text.includes('internal'), text);
});

// ---------- payments / shipping presentation ----------
test('config advertises per-farmer shipping and COD', async () => {
  const r = await call('GET', '/api/config');
  assert.deepEqual(r.body, { shippingPerFarmer: 40, paymentMethod: 'COD' });
});

test('place_order receives the per-farmer shipping fee', async () => {
  fake.calls.length = 0;
  await call('POST', '/api/orders', { as: 'buyer1', body: { items: [{ productId: 1, quantity: 1 }] } });
  assert.equal(fake.calls.find((c) => c.rpc === 'place_order').args.p_shipping_per_seller, 40);
});

test('order shows COD payment status derived from line status', async () => {
  const o2 = await call('GET', '/api/orders/2', { as: 'buyer1' });
  assert.equal(o2.body.paymentMethod, 'COD');
  assert.equal(o2.body.paymentStatus, 'Paid', 'all lines delivered');
  const o1 = await call('GET', '/api/orders/1', { as: 'buyer1' });
  assert.equal(o1.body.paymentStatus, 'Due');
});

// ---------- reviews ----------
test('public reviews list hides reviewer ids', async () => {
  const r = await call('GET', '/api/reviews?productId=1');
  assert.equal(r.status, 200);
  assert.equal(r.body.total, 1);
  assert.equal(r.body.items[0].reviewerName, 'Buyer One');
  assert.equal('reviewerId' in r.body.items[0], false);
  assert.equal((await call('GET', '/api/reviews')).status, 400, 'productId required');
  assert.equal((await call('GET', '/api/reviews?productId=abc')).status, 400);
});

test('review eligibility: only own, delivered, not-yet-reviewed lines', async () => {
  assert.equal((await call('GET', '/api/reviews/eligible?productId=1')).status, 401);
  assert.equal((await call('GET', '/api/reviews/eligible?productId=1', { as: 'farmerA' })).status, 403);
  const r = await call('GET', '/api/reviews/eligible?productId=1', { as: 'buyer1' });
  assert.deepEqual(r.body.items.map((i) => i.orderItemId), [51], 'line 50 already has a review');
  assert.deepEqual((await call('GET', '/api/reviews/eligible?productId=1', { as: 'buyerNoAddr' })).body.items, []);
});

test('posting reviews: validation, role, ownership and friendly errors', async () => {
  const post = (as, body) => call('POST', '/api/reviews', { as, body });
  assert.equal((await post(undefined, { orderItemId: 51, rating: 5 })).status, 401);
  assert.equal((await post('farmerA', { orderItemId: 51, rating: 5 })).status, 403, 'farmers cannot review');
  for (const bad of [{}, { orderItemId: 51, rating: 0 }, { orderItemId: 51, rating: 6 }, { orderItemId: 51, rating: 4.5 }, { orderItemId: -1, rating: 3 }, { orderItemId: 51, rating: 3, comment: 'x'.repeat(1001) }]) {
    assert.equal((await post('buyer1', bad)).status, 400, JSON.stringify(bad).slice(0, 60));
  }
  assert.equal((await post('buyerNoAddr', { orderItemId: 51, rating: 5 })).status, 404, "someone else's purchase");
  assert.equal((await post('buyer1', { orderItemId: 50, rating: 5 })).status, 409, 'duplicate review');
  const pending = await post('buyer1', { orderItemId: 1, rating: 5 });
  assert.equal(pending.status, 409, 'a line that is not delivered yet cannot be reviewed');
  const ok = await post('buyer1', { orderItemId: 51, rating: 4, comment: '  Tasty  ', reviewerName: 'Hacker', productId: 2 });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.rating, 4);
  assert.equal(ok.body.reviewerName, 'Buyer One', 'name comes from the profile, not the body');
  assert.equal(ok.body.productId, 1, 'product comes from the order line, not the body');
  assert.equal('reviewerId' in ok.body, false);
});

test('own reviews list and delete', async () => {
  const mine = await call('GET', '/api/reviews/mine', { as: 'buyer1' });
  assert.ok(mine.body.items.length >= 1 && mine.body.items.every((r) => r.productName));
  const id = mine.body.items[0].id;
  assert.equal((await call('DELETE', `/api/reviews/${id}`, { as: 'buyerNoAddr' })).status, 404, "can't delete others' reviews");
  assert.equal((await call('DELETE', `/api/reviews/${id}`, { as: 'buyer1' })).status, 204);
  assert.equal((await call('DELETE', '/api/reviews/abc', { as: 'buyer1' })).status, 404);
});

// ---------- notifications ----------
test('notifications are private, newest first, with unread count', async () => {
  assert.equal((await call('GET', '/api/notifications')).status, 401);
  const r = await call('GET', '/api/notifications', { as: 'buyer1' });
  assert.deepEqual(r.body.items.map((n) => n.id), [1, 2]);
  assert.equal(r.body.unread, 1);
  assert.ok(r.body.items.every((n) => !('userId' in n)));
  assert.deepEqual((await call('GET', '/api/notifications', { as: 'farmerA' })).body.items.map((n) => n.id), [3]);
  assert.equal((await call('GET', '/api/notifications', { as: 'nobody' })).body.items.length, 0);
});

test('marking notifications read only affects the caller', async () => {
  assert.equal((await call('PATCH', '/api/notifications/3/read', { as: 'buyer1' })).status, 404, "not buyer1's");
  assert.equal(fake.db.Notification.find((n) => n.id === 3).read, false);
  assert.equal((await call('PATCH', '/api/notifications/1/read', { as: 'buyer1' })).status, 204);
  assert.equal((await call('PATCH', '/api/notifications/xyz/read', { as: 'buyer1' })).status, 404);
  assert.equal((await call('POST', '/api/notifications/read-all', { as: 'farmerA' })).status, 204);
  assert.equal(fake.db.Notification.find((n) => n.id === 3).read, true);
  assert.equal((await call('GET', '/api/notifications', { as: 'farmerA' })).body.unread, 0);
});

// ---------- image upload ----------
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(50)]);
const upload = (as, body, type = 'application/octet-stream') =>
  fetch(`${base}/api/uploads/product-image`, { method: 'POST', headers: { 'content-type': type, ...(as ? { authorization: `Bearer tok-${as}` } : {}) }, body });

test('image upload: auth + farmer role required', async () => {
  assert.equal((await upload(undefined, PNG)).status, 401);
  assert.equal((await upload('buyer1', PNG)).status, 403);
});

test('image upload sniffs the real file type and rejects everything else', async () => {
  for (const [name, buf] of [['png', PNG], ['jpg', JPG], ['webp', WEBP]]) {
    const r = await upload('farmerA', buf, 'image/' + name);
    assert.equal(r.status, 201, name);
    const body = await r.json();
    assert.match(body.url, /^https:\/\/cdn\.example\/product-images\/farmerA\/[0-9a-f-]{36}\.(png|jpg|webp)$/);
  }
  const last = fake.uploads.at(-1);
  assert.equal(last.opts.contentType, 'image/webp');
  assert.equal(last.opts.upsert, false);
  // renamed non-images, SVG (script-capable), HTML, empty bodies
  for (const bad of [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), Buffer.from('<html></html>'), Buffer.from('GIF89a......'), Buffer.alloc(0)]) {
    const r = await upload('farmerA', bad, 'image/png');
    assert.equal(r.status, 400);
  }
  assert.equal(fake.uploads.length, 3, 'rejected files never reach storage');
});

test('image upload enforces the size limit and unique, uid-scoped names', async () => {
  const big = Buffer.concat([JPG, Buffer.alloc(3 * 1024 * 1024)]);
  assert.equal((await upload('farmerA', big, 'image/jpeg')).status, 413);
  const a = await (await upload('farmerA', PNG, 'image/png')).json();
  const b = await (await upload('farmerA', PNG, 'image/png')).json();
  assert.notEqual(a.url, b.url);
  const c = await (await upload('farmerB', PNG, 'image/png')).json();
  assert.match(c.url, /\/farmerB\//);
});

// ---------- regression tests from the deep review ----------
test('authenticated responses are never cacheable; public categories still are', async () => {
  const orders = await call('GET', '/api/orders', { as: 'buyer1' });
  assert.equal(orders.headers.get('cache-control'), 'no-store');
  assert.equal((await call('GET', '/api/profile', { as: 'buyer1' })).headers.get('cache-control'), 'no-store');
  assert.equal((await call('GET', '/api/notifications', { as: 'buyer1' })).headers.get('cache-control'), 'no-store');
  assert.equal((await call('GET', '/api/categories')).headers.get('cache-control'), 'public, max-age=60');
});

test('category counts come from the SQL aggregate', async () => {
  const r = await call('GET', '/api/categories');
  const veg = r.body.find((c) => c.id === 1);
  assert.equal(veg.productCount, 2, 'Tomato + the created Carrot are in stock');
  assert.equal(r.body.find((c) => c.id === 2).productCount, 0, 'Apple is sold out / removed');
});

test('order stats come from SQL for the caller and role only', async () => {
  assert.equal((await call('GET', '/api/orders/stats')).status, 401);
  const r = await call('GET', '/api/orders/stats', { as: 'farmerA' });
  assert.deepEqual(r.body, { forUser: 'farmerA', role: 'Farmer', orders: 7 });
  assert.equal((await call('GET', '/api/orders/stats', { as: 'buyer1' })).body.role, 'Buyer');
});

test('a concurrent duplicate review (unique violation) is a 409, not a 500', async () => {
  const r = await call('POST', '/api/reviews', { as: 'buyer1', body: { orderItemId: 777, rating: 5 } });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /already reviewed/);
});

test('auth: a bad token is 401, but an outage while checking it is 503 (client retries, is not logged out)', async () => {
  assert.equal((await call('GET', '/api/orders', { headers: { authorization: 'Bearer nonsense' } })).status, 401);
  const down = await call('GET', '/api/orders', { as: 'infra-down' });
  assert.equal(down.status, 503);
  assert.equal(down.body.code, 'auth_unavailable');
});

test('buyers cannot store a terrain via profile update', async () => {
  const r = await call('PATCH', '/api/profile', { as: 'buyer1', body: { terrain: 'Hills', name: 'Buyer One' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.terrain, undefined);
});

test('the server really listens under NODE_ENV=production outside Vercel', async () => {
  const { spawn } = await import('node:child_process');
  const port = 5600 + Math.floor(Math.random() * 300);
  const child = spawn(process.execPath, ['index.js'], { cwd: new URL('..', import.meta.url).pathname, env: { PATH: process.env.PATH, NODE_ENV: 'production', PORT: String(port) } });
  try {
    let ok = false;
    for (let i = 0; i < 40 && !ok; i++) {
      await new Promise((r) => setTimeout(r, 150));
      ok = await fetch(`http://127.0.0.1:${port}/api/health`).then((r) => r.ok, () => false);
    }
    assert.ok(ok, 'server answered /api/health');
  } finally {
    child.kill();
  }
});

test('upload quota: a farmer cannot store more than 200 photos', async () => {
  for (let i = 0; i < 200; i++) fake.uploads.push({ bucket: 'product-images', path: `quotaFarmer/seed-${i}.png`, bytes: 1 });
  const r = await upload('quotaFarmer', PNG, 'image/png');
  // quotaFarmer has no profile, so create one and retry
  assert.equal(r.status, 403);
  fake.db.Profile.push({ uid: 'quotaFarmer', name: 'Quota', role: 'Farmer', address: 'x' });
  const blocked = await upload('quotaFarmer', PNG, 'image/png');
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).code, 'quota');
  assert.equal((await upload('farmerA', PNG, 'image/png')).status, 201, 'other farmers are unaffected');
});
