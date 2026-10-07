// Robustness sweep: hostile or malformed input must be answered with a 4xx, never a 5xx or a crash.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import { createFakeSupabase } from './fakeSupabase.js';

let server, base;
const seed = {
  Category: [{ id: 1, name: 'Vegetables' }],
  Profile: [
    { uid: 'farmerA', name: 'Farm A', role: 'Farmer', address: 'a' },
    { uid: 'buyer1', name: 'Buyer One', role: 'Buyer', address: '1 Main St' },
  ],
  Order: [], OrderItem: [], Review: [], Notification: [], ContactMessage: [],
  Product: [{ id: 1, name: 'Tomato', price: 2.5, quantityAvailable: 10, sellerId: 'farmerA', categoryId: 1, categoryName: 'Vegetables', created_at: '2025-01-01' }],
};
const verify = async (t) => {
  if (!t.startsWith('tok-')) throw Object.assign(new Error('bad'), { code: 'ERR_JWT_INVALID' });
  return { uid: t.slice(4) };
};
// RPCs behave like the SQL: unknown things are "not found", never an unexpected shape.
const LISTS = new Set(['category_counts', 'eligible_review_items']);
const rpcs = new Proxy({}, { get: (_t, name) => async () => (LISTS.has(name) ? { data: [], error: null } : name === 'order_stats' ? { data: { orders: 0 }, error: null } : { data: null, error: { message: 'not_found' } }) });

before(async () => {
  const app = createApp({ supabase: createFakeSupabase(seed, rpcs), verify, limits: { general: 1e9, writes: 1e9, contact: 1e9 } });
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const deep = (n) => (n === 0 ? 'x' : { a: deep(n - 1) });
const BODIES = [
  null, [], [[]], 'string', 123, true, {}, { items: 'x' }, { items: [null] }, { items: [{}] }, { items: [{ productId: '1', quantity: '1' }] },
  { items: [{ productId: 1e308, quantity: 1 }] }, { items: [{ productId: -0, quantity: 1 }] }, { items: Array(500).fill({ productId: 1, quantity: 1 }) },
  { name: 'x'.repeat(5000) }, { name: '\u0000‮' }, { name: { $ne: null } }, { name: ['a'] }, { price: 'NaN' }, { price: 1e999 }, { price: -1 }, { price: 0.001 },
  { quantityAvailable: 2 ** 53 }, { quantityAvailable: -1 }, { categoryId: '1 OR 1=1' }, { categoryId: [1] },
  { rating: 'five' }, { rating: 5, orderItemId: 'abc' }, { rating: 5, orderItemId: 1e30 }, { status: 'Delivered; DROP TABLE' }, { status: ['Pending'] },
  { role: 'Farmer', name: 'A', terrain: 'Mars' }, { role: ['Farmer'] }, { name: 'ok', role: 'Buyer', contactNumber: 'x'.repeat(100) },
  { __proto__: { admin: true }, name: 'ab' }, JSON.parse('{"__proto__": {"admin": true}, "name": "abc", "role": "Buyer"}'), JSON.parse('{"constructor": {"prototype": {"x": 1}}}'),
  deep(60), { email: 'not-an-email', name: 'abc', message: 'x'.repeat(20) }, { email: 'a@b.co', name: 'abc', message: 'short' },
  { imageUrl: 'javascript:alert(1)' }, { imageUrl: 'https://' + 'a'.repeat(600) + '.com' }, { unit: 'kg; DROP' },
];
const IDS = ['0', '-1', 'NaN', '1e9', '9'.repeat(40), '%00', '..%2F..', "1'--", '1;2', ' ', '１２'];
const QUERIES = [
  'limit=-1', 'limit=abc', 'limit=1e9', 'offset=-5', 'offset=9999999999999', 'sort=;', 'q=' + 'a'.repeat(500), 'q=%00%FF', 'q=' + encodeURIComponent("'); DROP TABLE x;--"),
  'categoryIds=1,2,x', 'categoryIds=' + '1,'.repeat(100), 'ids=' + '1,'.repeat(100), 'ids=,', 'minPrice=-1', 'minPrice=abc&maxPrice=Infinity', 'productionType=' + 'A,'.repeat(200),
  'inStock=maybe', 'sellerId=' + 'a'.repeat(500), 'productId=0', 'productId=1&limit=0', 'q[]=a&q[]=b', 'q[a]=b', 'limit=1&limit=2',
];
const ROUTES = [
  ['GET', '/api/products'], ['GET', '/api/reviews'], ['GET', '/api/reviews/eligible'], ['GET', '/api/orders'], ['GET', '/api/categories'],
  ['GET', '/api/notifications'], ['GET', '/api/orders/stats'], ['GET', '/api/products/mine'],
];
const BODY_ROUTES = [
  ['POST', '/api/products'], ['POST', '/api/orders'], ['POST', '/api/profile'], ['PATCH', '/api/profile'], ['POST', '/api/reviews'], ['POST', '/api/contact'],
  ['PATCH', '/api/products/1'], ['PUT', '/api/products/1/stock'], ['PATCH', '/api/orders/items/1/status'],
];
const ID_ROUTES = [
  ['GET', '/api/products/:id'], ['PATCH', '/api/products/:id'], ['DELETE', '/api/products/:id'], ['PUT', '/api/products/:id/stock'], ['GET', '/api/orders/:id'],
  ['PATCH', '/api/orders/items/:id/status'], ['DELETE', '/api/reviews/:id'], ['PATCH', '/api/notifications/:id/read'],
];
const WHO = [undefined, 'farmerA', 'buyer1', 'ghost', 'x'.repeat(2000)];

const hit = async (method, path, who, body, raw) => {
  const headers = { ...(who ? { authorization: `Bearer tok-${who}` } : {}) };
  let payload;
  if (raw !== undefined) { payload = raw; headers['content-type'] = 'application/json'; }
  else if (body !== undefined) { payload = JSON.stringify(body); headers['content-type'] = 'application/json'; }
  const res = await fetch(base + path, { method, headers, body: ['GET', 'DELETE'].includes(method) ? undefined : payload });
  const text = await res.text();
  return { status: res.status, text };
};
const assertSafe = (r, what) => {
  assert.ok(r.status < 500, `${what} -> ${r.status}: ${r.text.slice(0, 200)}`);
  assert.ok(!/at (async )?[\w.<>]+ \(|node_modules|\/Users\/|ECONN|stack/i.test(r.text), `${what} leaked internals: ${r.text.slice(0, 200)}`);
};

test('fuzz: hostile query strings never cause a 5xx or leak internals', async () => {
  for (const [m, p] of ROUTES) for (const q of QUERIES) for (const who of ['farmerA', 'buyer1']) assertSafe(await hit(m, `${p}?${q}`, who), `${m} ${p}?${q.slice(0, 40)} as ${who}`);
});

test('fuzz: malformed bodies never cause a 5xx, for every role', async () => {
  for (const [m, p] of BODY_ROUTES) for (const who of WHO) for (const b of BODIES) assertSafe(await hit(m, p, who, b), `${m} ${p} as ${String(who).slice(0, 10)} body=${JSON.stringify(b)?.slice(0, 50)}`);
});

test('fuzz: hostile path ids never cause a 5xx', async () => {
  for (const [m, tpl] of ID_ROUTES) for (const id of IDS) for (const who of ['farmerA', 'buyer1']) assertSafe(await hit(m, tpl.replace(':id', encodeURIComponent(id)), who, m === 'GET' || m === 'DELETE' ? undefined : { status: 'Cancelled', quantityAvailable: 1 }), `${m} ${tpl} id=${id}`);
});

test('fuzz: invalid JSON syntax and odd content-types', async () => {
  for (const raw of ['{', '}', '{"a":', '\u0000', '[1,2', '{"a":1}}', 'undefined', '﻿{"name":"x"}', '{"a":"\\ud800"}']) assertSafe(await hit('POST', '/api/contact', undefined, undefined, raw), `invalid json ${JSON.stringify(raw)}`);
  for (const ct of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=x', 'application/json; charset=utf-16', '']) {
    const res = await fetch(base + '/api/contact', { method: 'POST', headers: { 'content-type': ct }, body: 'name=a&email=b' });
    assert.ok(res.status < 500, `content-type "${ct}" -> ${res.status}`);
  }
});

test('fuzz: oversized and unusual requests', async () => {
  const big = await fetch(base + '/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"a":"' + 'x'.repeat(200_000) + '"}' });
  assert.equal(big.status, 413);
  for (const method of ['OPTIONS', 'HEAD', 'TRACE', 'PUT', 'DELETE']) {
    const res = await fetch(base + '/api/categories', { method }).catch(() => ({ status: 0 }));
    assert.ok(res.status < 500, `${method} /api/categories -> ${res.status}`);
  }
  const res = await fetch(base + '/api/' + 'a'.repeat(10_000));
  assert.ok(res.status < 500);
});

test('prototype pollution attempts leave Object.prototype untouched', async () => {
  await hit('POST', '/api/profile', 'buyer1', undefined, '{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"name":"abc","role":"Buyer"}');
  await hit('PATCH', '/api/products/1', 'farmerA', undefined, '{"__proto__":{"polluted":true},"price":3}');
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
});
