import express from 'express';
import { authenticate, loadProfile, requireRole } from '../middleware/auth.js';
import { ApiError, badRequest, conflict, dbError, notFound, wrap } from '../lib/errors.js';
import { orderCreate, orderItemStatus, parse } from '../lib/schemas.js';
import { config } from '../config.js';

const isId = (v) => /^\d{1,15}$/.test(v);

/** One order can span several farmers, so its overall status is derived from its lines. */
export function deriveStatus(items) {
  if (!items.length) return 'Pending';
  const active = items.map((i) => i.status).filter((s) => s !== 'Cancelled');
  if (!active.length) return 'Cancelled';
  if (active.every((s) => s === 'Delivered')) return 'Delivered';
  if (active.every((s) => s === 'Pending')) return 'Pending';
  if (active.every((s) => s === 'Shipped' || s === 'Delivered')) return 'Shipped';
  return 'Processing';
}

/** Cash on delivery: a line is paid once delivered. Cancelled lines owe nothing. */
export function paymentStatus(items) {
  const live = items.filter((i) => i.status !== 'Cancelled');
  if (!live.length) return 'Cancelled';
  return live.every((i) => i.status === 'Delivered') ? 'Paid' : 'Due';
}

/** Shape an Order row for the caller: buyers see everything, a farmer sees only their own lines. */
function present(order, uid) {
  const isBuyer = order.buyerId === uid;
  const items = (order.items || []).filter((i) => isBuyer || i.sellerId === uid).sort((a, b) => a.id - b.id);
  const live = items.filter((i) => i.status !== 'Cancelled');
  return {
    id: order.id,
    created_at: order.created_at,
    buyerId: order.buyerId,
    buyerName: order.buyerName,
    shippingAddress: order.shippingAddress,
    contactNumber: order.contactNumber,
    shippingAmount: Number(order.shippingAmount),
    totalAmount: Number(order.totalAmount),
    // What this caller is owed / owes for the lines they can see.
    itemsSubtotal: live.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0),
    status: deriveStatus(items),
    paymentMethod: order.paymentMethod ?? 'COD',
    paymentStatus: paymentStatus(items),
    items: items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice) })),
  };
}

export default function orderRoutes({ supabase, verify }) {
  const router = express.Router();
  router.use(authenticate(verify), loadProfile(supabase));

  // Buyers get their purchases; farmers get orders containing their products.
  router.get(
    '/',
    wrap(async (req, res) => {
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const uid = req.auth.uid;

      let query = supabase.from('Order').select('*, items:OrderItem!inner(*)', { count: 'exact' });
      query = req.profile.role === 'Farmer' ? query.eq('items.sellerId', uid) : query.eq('buyerId', uid);

      const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (error) throw dbError(error, 'list orders');
      res.json({ items: data.map((o) => present(o, uid)), total: count ?? data.length });
    }),
  );

  // Totals over ALL of the caller's orders (computed in SQL, so they stay right beyond the first page).
  router.get(
    '/stats',
    wrap(async (req, res) => {
      const { data, error } = await supabase.rpc('order_stats', { p_user_id: req.auth.uid, p_role: req.profile.role });
      if (error) throw dbError(error, 'order stats');
      res.json(data);
    }),
  );

  router.get(
    '/:id',
    wrap(async (req, res) => {
      if (!isId(req.params.id)) throw notFound('Order not found');
      const order = await fetchOrder(supabase, req.params.id);
      const uid = req.auth.uid;
      const allowed = order && (order.buyerId === uid || order.items.some((i) => i.sellerId === uid));
      if (!allowed) throw notFound('Order not found'); // same answer for "missing" and "not yours"
      res.json(present(order, uid));
    }),
  );

  router.post(
    '/',
    requireRole('Buyer'),
    wrap(async (req, res) => {
      const { items } = parse(orderCreate, req.body);
      if (!req.profile.address) throw badRequest('Add a delivery address to your profile before checking out');

      const { data: orderId, error } = await supabase.rpc('place_order', {
        p_buyer_id: req.auth.uid,
        p_buyer_name: req.profile.name,
        p_shipping_per_seller: config.shippingPerFarmer,
        p_address: req.profile.address,
        p_phone: req.profile.contactNumber ?? null,
        p_items: items,
      });

      if (error) {
        const msg = error.message || '';
        if (msg.startsWith('insufficient_stock:')) {
          const { data: p } = await supabase.from('Product').select('name').eq('id', msg.split(':')[1]).maybeSingle();
          throw conflict(`Not enough stock for ${p ? `"${p.name}"` : 'one of the items'}. Please update your cart.`);
        }
        if (msg.startsWith('own_product:')) throw badRequest("You can't buy your own products");
        if (msg.startsWith('empty_order')) throw badRequest('Your cart is empty');
        throw dbError(error, 'place order');
      }

      const order = await fetchOrder(supabase, orderId);
      if (!order) throw dbError(new Error(`order ${orderId} missing after place_order`), 'fetch placed order');
      res.status(201).json(present(order, req.auth.uid));
    }),
  );

  // Move one order line along (seller: process/ship/deliver/cancel, buyer: cancel while Pending).
  router.patch(
    '/items/:itemId/status',
    wrap(async (req, res) => {
      if (!isId(req.params.itemId)) throw notFound('Order item not found');
      const { status } = parse(orderItemStatus, req.body);

      const { data, error } = await supabase.rpc('update_order_item_status', {
        p_item_id: req.params.itemId,
        p_actor_id: req.auth.uid,
        p_new_status: status,
      });
      if (error) {
        const msg = error.message || '';
        if (msg.startsWith('not_found')) throw notFound('Order item not found');
        if (msg.startsWith('invalid_transition:')) {
          const [from, to] = msg.split(':')[1].split('->');
          throw new ApiError(409, `This item can't move from ${from} to ${to}.`, 'invalid_transition');
        }
        throw dbError(error, 'update order item status');
      }
      res.json(data);
    }),
  );

  return router;
}

async function fetchOrder(supabase, id) {
  const { data, error } = await supabase.from('Order').select('*, items:OrderItem(*)').eq('id', id).maybeSingle();
  if (error) throw dbError(error, 'fetch order');
  return data;
}
