// Verifies backend/schema.sql against a real Postgres engine (PGlite, in-process, dev-only dependency).
// Covers: upgrading the original v1 schema with data, idempotency, and every rule enforced in SQL.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const v2 = fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const v1 = fs.readFileSync(new URL('./fixtures/schema_v1.sql', import.meta.url), 'utf8');
const ok = (c, m) => assert.ok(c, m);
const roles = `create role anon; create role authenticated; create role service_role;`;

async function expectErr(db, sql, params, frag, msg) {
  let err = null;
  try { await db.query(sql, params); } catch (e) { err = e; }
  assert.ok(err, msg + ' (expected an error but none was raised)');
  assert.ok(err.message.includes(frag), `${msg} -> got: ${err.message}`);
}

test('schema.sql upgrades a v1 database in place, keeps data, and is re-runnable', async () => {
  const db = new PGlite(); await db.exec(roles); await db.exec(v1);
  await db.exec(`insert into "Product"(name,price,"quantityAvailable","sellerId","categoryId") values ('Old Apple',2,10,7,1);
                 insert into "Order"("buyerId","buyerName","totalAmount") values (123,'x',5);`);
  await db.exec(v2);
  const p = await db.query(`select "sellerId", pg_typeof("sellerId")::text t from "Product"`);
  ok(p.rows[0].sellerId === '7' && p.rows[0].t === 'text', 'v1 upgrade keeps rows, sellerId int->text');
  await db.exec(v2); ok(true, 'schema.sql is re-runnable (idempotent)');
  const cats = await db.query(`select count(*)::int c from "Category"`); ok(cats.rows[0].c === 10, 'categories seeded to 10');
  await db.exec(`insert into "Category"(name) values ('New')`); // would collide if the sequence were not advanced
});

test('SQL functions enforce stock, ownership, status transitions, reviews and notifications', async () => {
const db = new PGlite(); await db.exec(roles); await db.exec(v2);
await db.exec(`insert into "Product"(name,price,"quantityAvailable","sellerId","sellerName",unit,"categoryId") values
  ('Tomato',2.50,10,'farmerA','Farm A','kg',1), ('Honey',8,3,'farmerB','Farm B','jar',6);`);
const place = (buyer, items, ship = 5) => db.query(`select place_order($1,$2,$3,'1 Main St','555',$4::jsonb) id`, [buyer, 'Buyer', ship, JSON.stringify(items)]);

let r = await place('buyer1', [{ productId: 1, quantity: 4 }, { productId: 2, quantity: 1 }]);
const oid = r.rows[0].id;
const o = await db.query(`select "totalAmount"::float t from "Order" where id=$1`, [oid]);
ok(o.rows[0].t === 4 * 2.5 + 8 + 5 * 2, 'total = DB prices + shipping per farmer (2 farmers x 5) = 28');
const shipRow = await db.query(`select "shippingAmount"::float s, "paymentMethod" pm from "Order" where id=$1`, [oid]);
ok(shipRow.rows[0].s === 10 && shipRow.rows[0].pm === 'COD', 'shippingAmount stored (10) and paymentMethod is COD');
const n1 = await db.query(`select "userId", title from "Notification" order by id`);
ok(n1.rows.length === 2 && n1.rows.map((r) => r.userId).sort().join() === 'farmerA,farmerB', 'each farmer is notified of the new order');
const st = await db.query(`select "quantityAvailable" q from "Product" order by id`);
ok(st.rows[0].q === 6 && st.rows[1].q === 2, 'stock decremented');
const items = await db.query(`select * from "OrderItem" where "orderId"=$1 order by id`, [oid]);
ok(items.rows.length === 2 && items.rows[0].sellerId === 'farmerA', 'order lines stored with seller + price snapshot');

r = await place('buyer1', [{ productId: 1, quantity: 3 }, { productId: 1, quantity: 3 }]);
const s2 = await db.query(`select "quantityAvailable" q from "Product" where id=1`);
ok(s2.rows[0].q === 0, 'duplicate lines for one product are merged and fully decremented');
const iss = await db.query(`select "inStock" i from "Product" where id=1`); ok(iss.rows[0].i === false, 'inStock flips to false at 0');

const ordersBefore = (await db.query(`select count(*)::int c from "Order"`)).rows[0].c;
await expectErr(db, `select place_order($1,$2,$3,'a','b',$4::jsonb)`, ['buyer2', 'B', 5, JSON.stringify([{ productId: 2, quantity: 1 }, { productId: 1, quantity: 1 }])], 'insufficient_stock:1', 'oversell rejected');
const ordersAfter = (await db.query(`select count(*)::int c from "Order"`)).rows[0].c;
const honey = (await db.query(`select "quantityAvailable" q from "Product" where id=2`)).rows[0].q;
ok(ordersAfter === ordersBefore && honey === 2, 'failed order rolls back completely (no order row, honey stock untouched)');
await expectErr(db, `select place_order($1,$2,$3,'a','b',$4::jsonb)`, ['farmerB', 'B', 5, JSON.stringify([{ productId: 2, quantity: 1 }])], 'own_product', 'cannot buy own product');
await expectErr(db, `select place_order($1,$2,$3,'a','b',$4::jsonb)`, ['b', 'B', 5, '[]'], 'empty_order', 'empty order rejected');
await expectErr(db, `select place_order($1,$2,$3,'a','b',$4::jsonb)`, ['b', 'B', 5, JSON.stringify([{ productId: 999, quantity: 1 }])], 'insufficient_stock:999', 'unknown product rejected');

// status machine
const item = items.rows[0].id; // farmerA's tomato line (qty 4), buyer1
const upd = (id, actor, s) => db.query(`select (update_order_item_status($1,$2,$3)).status st`, [id, actor, s]);
await expectErr(db, `select update_order_item_status($1,$2,$3)`, [item, 'stranger', 'Cancelled'], 'not_found', 'stranger cannot touch a line');
await expectErr(db, `select update_order_item_status($1,$2,$3)`, [item, 'farmerB', 'Processing'], 'not_found', 'other farmer cannot touch a line');
await expectErr(db, `select update_order_item_status($1,$2,$3)`, [item, 'buyer1', 'Shipped'], 'invalid_transition', 'buyer cannot ship');
await expectErr(db, `select update_order_item_status($1,$2,$3)`, [item, 'farmerA', 'Delivered'], 'invalid_transition', 'seller cannot skip Pending->Delivered');
ok((await upd(item, 'farmerA', 'Processing')).rows[0].st === 'Processing', 'seller Pending->Processing');
await expectErr(db, `select update_order_item_status($1,$2,$3)`, [item, 'buyer1', 'Cancelled'], 'invalid_transition', 'buyer cannot cancel once Processing');
ok((await upd(item, 'farmerA', 'Cancelled')).rows[0].st === 'Cancelled', 'seller Processing->Cancelled');
const restocked = (await db.query(`select "quantityAvailable" q, "inStock" i from "Product" where id=1`)).rows[0];
ok(restocked.q === 4 && restocked.i === true, 'cancel returns stock (0 -> 4) and flips inStock back');
await expectErr(db, `select update_order_item_status($1,$2,$3)`, [item, 'farmerA', 'Cancelled'], 'invalid_transition', 'cannot cancel twice (no double restock)');
const hon = items.rows[1].id;
ok((await upd(hon, 'buyer1', 'Cancelled')).rows[0].st === 'Cancelled', 'buyer can cancel own Pending line');

// notifications from status changes (item was cancelled by farmerA above, buyer cancelled honey)
const nAll = await db.query(`select "userId", body from "Notification" where type='order_status' order by id`);
ok(nAll.rows.some((r) => r.userId === 'buyer1' && /cancelled/.test(r.body)) && nAll.rows.some((r) => r.userId === 'farmerB' && /buyer cancelled/.test(r.body)), 'status changes notify the other party (buyer, and seller on buyer cancel)');

// ---- reviews
const rv = (id, buyer, rating, c = 'good') => db.query(`select (submit_review($1,$2,$3,$4,$5)).id rid`, [id, buyer, 'Buyer One', rating, c]);
await place('buyer2', [{ productId: 1, quantity: 2 }]); // product 1 restocked to 4 earlier
const o2 = (await db.query(`select id from "OrderItem" where "orderId" = (select max(id) from "Order") and "productId"=1`)).rows[0].id;
await expectErr(db, `select submit_review($1,$2,$3,$4,$5)`, [o2, 'buyer2', 'B', 5, 'x'], 'not_delivered', 'cannot review before delivery');
await upd(o2, 'farmerA', 'Processing'); await upd(o2, 'farmerA', 'Shipped'); await upd(o2, 'farmerA', 'Delivered');
await expectErr(db, `select submit_review($1,$2,$3,$4,$5)`, [o2, 'buyer1', 'B', 5, 'x'], 'not_found', 'another buyer cannot review this line');
await expectErr(db, `select submit_review($1,$2,$3,$4,$5)`, [o2, 'buyer2', 'B', 6, 'x'], 'invalid_rating', 'rating 6 rejected');
await expectErr(db, `select submit_review($1,$2,$3,$4,$5)`, [o2, 'buyer2', 'B', 0, 'x'], 'invalid_rating', 'rating 0 rejected');
await expectErr(db, `select submit_review($1,$2,$3,$4,$5)`, [o2, 'buyer2', 'B', 4, 'x'.repeat(1001)], 'check constraint', 'comment over 1000 chars rejected');
const r1 = await db.query(`select (submit_review($1,$2,$3,$4,$5)).id rid`, [o2, 'buyer2', 'B Two', 4, '  Nice  ']);
const pr = (await db.query(`select rating::float r, reviews from "Product" where id=1`)).rows[0];
ok(pr.r === 4 && pr.reviews === 1, 'product rating/count updated by review');
ok((await db.query(`select comment from "Review"`)).rows[0].comment === 'Nice', 'comment is trimmed');
await expectErr(db, `select submit_review($1,$2,$3,$4,$5)`, [o2, 'buyer2', 'B', 5, 'again'], 'already_reviewed', 'one review per purchased line');
ok((await db.query(`select 1 from "Notification" where "userId"='farmerA' and type='review'`)).rows.length === 1, 'seller notified of review');
await expectErr(db, `select delete_review($1,$2)`, [r1.rows[0].rid, 'buyer1'], 'not_found', "cannot delete someone else's review");
await db.query(`select delete_review($1,$2)`, [r1.rows[0].rid, 'buyer2']);
const pr2 = (await db.query(`select rating::float r, reviews from "Product" where id=1`)).rows[0];
ok(pr2.r === 0 && pr2.reviews === 0, 'deleting the review resets the aggregate');

// ---- aggregates (functions that replaced row-pulling in Node)
const cc = await db.query(`select * from category_counts()`);
ok(cc.rows.every((r) => r.n > 0) && cc.rows.some((r) => r.categoryId === 1), 'category_counts returns in-stock counts per category');
await db.query(`update "Product" set "quantityAvailable" = 0 where id = 2`);
ok(!(await db.query(`select * from category_counts()`)).rows.some((r) => r.categoryId === 6), 'sold-out products are not counted');

// buyer2 has one delivered+reviewed-then-deleted line (o2) => eligible again; buyer1's lines are cancelled
const el = await db.query(`select * from eligible_review_items($1, 1)`, ['buyer2']);
ok(el.rows.length === 1 && Number(el.rows[0].orderItemId) === Number(o2), 'eligible_review_items: delivered line, review deleted -> eligible again');
ok((await db.query(`select * from eligible_review_items($1, 1)`, ['buyer1'])).rows.length === 0, 'eligible_review_items: nothing for a buyer with no delivered line');
await db.query(`select submit_review($1,$2,$3,$4,$5)`, [o2, 'buyer2', 'B', 5, 'ok']);
ok((await db.query(`select * from eligible_review_items($1, 1)`, ['buyer2'])).rows.length === 0, 'eligible_review_items: reviewed lines drop out');

// Hand-computed from the scenario above:
//   farmerA lines: o2 delivered (2 x 2.5 = 5), buyer1's merged 6 x 2.5 = 15 still Pending, the first order's tomato line cancelled.
const fs_ = (await db.query(`select order_stats('farmerA','Farmer') s`)).rows[0].s;
assert.equal(fs_.revenue, 5, 'farmer revenue counts only Delivered lines');
assert.equal(fs_.openItems, 1, 'farmer open items = the one pending merged line');
assert.equal(fs_.orders, 3, 'farmer orders = distinct orders with their lines (incl. cancelled)');
assert.equal(fs_.months.length, 1);
assert.equal(fs_.months[0].sales, 20, 'monthly sales = delivered 5 + pending 15, excluding the cancelled line');
assert.match(fs_.months[0].month, /^\d{4}-\d{2}$/);
//   buyer1: order 1 fully cancelled (not in progress, spent 0); order 2 pending: 6 x 2.5 + 5 shipping = 20.
const bs = (await db.query(`select order_stats('buyer1','Buyer') s`)).rows[0].s;
assert.deepEqual({ ...bs }, { orders: 2, inProgress: 1, delivered: 0, spent: 20 }, 'buyer1 stats');
//   buyer2: one delivered order: 2 x 2.5 + 5 shipping = 10.
const bs2 = (await db.query(`select order_stats('buyer2','Buyer') s`)).rows[0].s;
assert.deepEqual({ ...bs2 }, { orders: 1, inProgress: 0, delivered: 1, spent: 10 }, 'buyer2 stats');
ok((await db.query(`select order_stats('nobody','Buyer') s`)).rows[0].s.orders === 0, 'order_stats(buyer): empty for unknown user');
ok((await db.query(`select order_stats('nobody','Farmer') s`)).rows[0].s.orders === 0, 'order_stats(farmer): empty for unknown user');

// check constraints
await expectErr(db, `update "Product" set "quantityAvailable" = -1 where id=1`, [], 'product_qty_nonneg', 'negative stock blocked by constraint');
});
