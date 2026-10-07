import { ApiError } from "@/lib/api";
import type { AppNotification, Order, OrderItem, OrderStatus, Paged, Product, Profile, Review } from "@/types";
import { MOCK_CATEGORIES, MOCK_PRODUCTS, mockReviews } from "./data";
import { DEMO_PROFILES, getMockProfile } from "./session";

export const MOCK_ENABLED = import.meta.env.VITE_MOCK === "true";

type Params = Record<string, string | number | boolean | undefined | null>;
type Body = Record<string, unknown> | Blob | undefined;

const SHIPPING = 40;
const STORE = "agrilink:mock:state:v1";
const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

interface StoredOrder extends Omit<Order, "items" | "itemsSubtotal" | "status" | "paymentStatus" | "shippingAmount" | "totalAmount"> {
  items: OrderItem[];
}
interface PostedReview extends Review { orderItemId: number; reviewerId: string }
interface State {
  products: Product[];
  orders: StoredOrder[];
  reviews: PostedReview[];
  notifications: Record<"Buyer" | "Farmer", AppNotification[]>;
  profiles: Partial<Record<"Buyer" | "Farmer", Partial<Profile>>>;
  uploads: Record<string, string>;
  seq: { product: number; order: number; item: number; review: number; notif: number };
}

// ---- seed ------------------------------------------------------------------------------------------------------

const BUYERS = { me: ["demo-buyer", "Demo Buyer"], a: ["b-ananya", "Ananya Rao"], k: ["b-karthik", "Karthik Iyer"], s: ["b-sana", "Sana Khan"] } as const;
type Seed = [buyer: keyof typeof BUYERS, daysAgo: number, lines: [productId: number, qty: number, status: OrderStatus][]];
const SEED_ORDERS: Seed[] = [
  ["me", 1, [[1, 2, "Pending"], [16, 2, "Pending"], [26, 1, "Processing"]]],
  ["me", 6, [[9, 1, "Shipped"], [4, 1, "Shipped"]]],
  ["me", 16, [[19, 1, "Delivered"], [29, 2, "Delivered"], [31, 3, "Delivered"]]],
  ["me", 40, [[10, 2, "Delivered"], [11, 2, "Delivered"]]],
  ["a", 0, [[1, 5, "Pending"], [7, 2, "Pending"]]],
  ["k", 3, [[24, 2, "Processing"], [29, 3, "Processing"]]],
  ["s", 9, [[4, 3, "Shipped"], [1, 3, "Shipped"]]],
  ["a", 22, [[25, 1, "Delivered"], [4, 2, "Delivered"]]],
  ["k", 48, [[1, 6, "Delivered"], [29, 4, "Delivered"]]],
  ["s", 75, [[7, 3, "Delivered"], [24, 1, "Delivered"]]],
  ["a", 105, [[4, 5, "Delivered"], [1, 8, "Delivered"]]],
  ["k", 136, [[29, 6, "Delivered"], [25, 2, "Cancelled"]]],
];

function seedState(): State {
  const products = MOCK_PRODUCTS.map((p) => ({ ...p }));
  let item = 0;
  const orders: StoredOrder[] = SEED_ORDERS.map(([b, d, lines], i) => ({
    id: 1001 + i,
    created_at: ago(d),
    buyerId: BUYERS[b][0],
    buyerName: BUYERS[b][1],
    shippingAddress: b === "me" ? DEMO_PROFILES.Buyer.address : "27, Lake View Road, Mysuru, Karnataka 570001",
    contactNumber: b === "me" ? DEMO_PROFILES.Buyer.contactNumber : "9876511111",
    paymentMethod: "COD",
    items: lines.map(([pid, quantity, status]) => {
      const p = products.find((x) => x.id === pid)!;
      return { id: ++item, orderId: 1001 + i, productId: pid, productName: p.name, unit: p.unit, unitPrice: p.price, quantity, sellerId: p.sellerId, sellerName: p.sellerName, status };
    }),
  }));
  const n = (id: number, type: string, title: string, body: string, link: string, read: boolean, d: number): AppNotification =>
    ({ id, type, title, body, link, read, created_at: ago(d) });
  return {
    products, orders, reviews: [], profiles: {}, uploads: {},
    notifications: {
      Farmer: [
        n(1, "order", "New order #1005", "Ananya Rao ordered Fresh Tomatoes and Cauliflower.", "/order/1005", false, 0.1),
        n(2, "order", "New order #1006", "Karthik Iyer ordered Country Chicken and Free-range Eggs.", "/order/1006", true, 3),
        n(3, "review", "New review", "Someone rated Fresh Tomatoes 5 stars.", "/product/1", true, 8),
      ],
      Buyer: [
        n(101, "status", "Order #1002 shipped", "Alphonso Mangoes and Carrots are on the way.", "/order/1002", false, 1),
        n(102, "status", "Order #1003 delivered", "Rate what you received to help other buyers.", "/order/1003", true, 14),
      ],
    },
    seq: { product: 100, order: 2000, item: 500, review: 9000, notif: 500 },
  };
}

let state: State = (() => {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw) as State;
  } catch { /* fall through to a fresh seed */ }
  return seedState();
})();
const save = () => {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* too big or blocked: stays in memory only */ }
};
/** Uploaded demo photos are stored as data URLs under a fake https key; this turns the key back into something an <img> can load. */
export const resolveMockImage = (url: string) => (MOCK_ENABLED ? state.uploads[url] ?? url : url);

/** Wipes demo changes (orders placed, listings edited) and restores the seed. */
export const resetMockState = () => {
  state = seedState();
  save();
};

// ---- views -----------------------------------------------------------------------------------------------------

const live = (i: OrderItem) => i.status !== "Cancelled";
const sum = (items: OrderItem[]) => items.filter(live).reduce((s, i) => s + i.unitPrice * i.quantity, 0);
const sellersOf = (items: OrderItem[]) => new Set(items.map((i) => i.sellerId)).size;

function overall(items: OrderItem[]): OrderStatus {
  const s = items.map((i) => i.status);
  if (s.every((x) => x === "Cancelled")) return "Cancelled";
  const rest = s.filter((x) => x !== "Cancelled");
  if (rest.every((x) => x === "Delivered")) return "Delivered";
  if (rest.some((x) => x === "Shipped" || x === "Delivered")) return "Shipped";
  if (rest.some((x) => x === "Processing")) return "Processing";
  return "Pending";
}

function view(o: StoredOrder, role: "Buyer" | "Farmer", uid: string): Order | null {
  const items = role === "Farmer" ? o.items.filter((i) => i.sellerId === uid) : o.items;
  if (role === "Buyer" ? o.buyerId !== uid : items.length === 0) return null;
  const status = overall(items);
  const original = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const shipping = role === "Buyer" ? SHIPPING * sellersOf(o.items) : 0;
  const liveItems = items.filter(live);
  return {
    ...o, items, status, itemsSubtotal: sum(items), shippingAmount: shipping, totalAmount: original + shipping,
    paymentStatus: liveItems.length === 0 ? "Cancelled" : liveItems.every((i) => i.status === "Delivered") ? "Paid" : "Due",
  };
}

const myOrders = (role: "Buyer" | "Farmer", uid: string) =>
  state.orders.map((o) => view(o, role, uid)).filter((o): o is Order => !!o).sort((a, b) => b.created_at.localeCompare(a.created_at));

// ---- helpers ---------------------------------------------------------------------------------------------------

const paged = <T,>(all: T[], limit = 12, offset = 0): Paged<T> => ({ items: all.slice(offset, offset + limit), total: all.length });
const need = (): Profile => {
  const p = getMockProfile();
  if (!p) throw new ApiError(401, "Please sign in to continue.", "unauthorized");
  return { ...p, ...state.profiles[p.role] };
};
/** Only the two demo accounts have a notification feed; events about other buyers or farms are not delivered. */
const notify = (role: "Buyer" | "Farmer", toUid: string, type: string, title: string, body: string, link: string) => {
  if (toUid !== DEMO_PROFILES[role].uid) return;
  state.notifications[role].unshift({ id: ++state.seq.notif, type, title, body, link, read: false, created_at: new Date().toISOString() });
};

function listProducts(p: Params): Paged<Product> {
  let items = [...state.products];
  const csv = (v: Params[string]) => (v ? String(v).split(",") : []);
  const q = String(p.q ?? "").trim().toLowerCase();
  if (q) items = items.filter((x) => [x.name, x.description, x.categoryName, x.sellerName].some((s) => s?.toLowerCase().includes(q)));
  if (p.categoryIds) items = items.filter((x) => csv(p.categoryIds).includes(String(x.categoryId)));
  if (p.productionType) items = items.filter((x) => x.productionType && csv(p.productionType).includes(x.productionType));
  if (p.minPrice !== undefined) items = items.filter((x) => x.price >= Number(p.minPrice));
  if (p.maxPrice !== undefined) items = items.filter((x) => x.price <= Number(p.maxPrice));
  if (p.sellerId) items = items.filter((x) => x.sellerId === p.sellerId);
  if (p.ids) items = items.filter((x) => csv(p.ids).includes(String(x.id)));
  if (p.inStock) items = items.filter((x) => x.quantityAvailable > 0);
  if (p.sort === "popular") items.sort((a, b) => b.reviews * b.rating - a.reviews * a.rating);
  else if (p.sort === "price_asc") items.sort((a, b) => a.price - b.price);
  else if (p.sort === "price_desc") items.sort((a, b) => b.price - a.price);
  else items.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
  return paged(items, Number(p.limit) || 12, Number(p.offset) || 0);
}

const productById = (id: number) => {
  const p = state.products.find((x) => x.id === id);
  if (!p) throw new ApiError(404, "Product not found");
  return p;
};
const ownProduct = (id: number) => {
  const me = need();
  const p = productById(id);
  if (me.role !== "Farmer" || p.sellerId !== me.uid) throw new ApiError(403, "That isn't your listing.");
  return p;
};

function applyProductFields(p: Product, b: Record<string, unknown>) {
  if (typeof b.name === "string") p.name = b.name;
  if (typeof b.description === "string") p.description = b.description;
  if (typeof b.price === "number") p.price = b.price;
  if (typeof b.unit === "string") p.unit = b.unit;
  if (typeof b.quantityAvailable === "number") p.quantityAvailable = b.quantityAvailable;
  if (typeof b.productionType === "string") p.productionType = b.productionType;
  if (typeof b.imageUrl === "string") p.imageUrl = state.uploads[b.imageUrl] ?? (b.imageUrl || null);
  if (typeof b.categoryId === "number") {
    const c = MOCK_CATEGORIES.find((x) => x.id === b.categoryId);
    if (c) { p.categoryId = c.id; p.categoryName = c.name; }
  }
  p.inStock = p.quantityAvailable > 0;
}

function placeOrder(b: Record<string, unknown>): Order {
  const me = need();
  if (me.role !== "Buyer") throw new ApiError(403, "Seller accounts can't place orders.");
  const lines = (b.items as { productId: number; quantity: number }[] | undefined) ?? [];
  if (!lines.length) throw new ApiError(400, "Your basket is empty.");
  const items: OrderItem[] = lines.map((l) => {
    const p = productById(l.productId);
    if (p.quantityAvailable < l.quantity) throw new ApiError(409, `Only ${p.quantityAvailable} ${p.unit} of ${p.name} left.`, "out_of_stock");
    return { id: 0, orderId: 0, productId: p.id, productName: p.name, unit: p.unit, unitPrice: p.price, quantity: l.quantity, sellerId: p.sellerId, sellerName: p.sellerName, status: "Pending" };
  });
  const id = ++state.seq.order;
  for (const it of items) {
    it.id = ++state.seq.item;
    it.orderId = id;
    const p = productById(it.productId!);
    p.quantityAvailable -= it.quantity;
    p.inStock = p.quantityAvailable > 0;
  }
  state.orders.push({ id, created_at: new Date().toISOString(), buyerId: me.uid, buyerName: me.name, shippingAddress: me.address, contactNumber: me.contactNumber, paymentMethod: "COD", items });
  for (const sellerId of new Set(items.map((i) => i.sellerId))) {
    notify("Farmer", sellerId, "order", `New order #${id}`, `${me.name} ordered ${items.filter((i) => i.sellerId === sellerId).length} of your items.`, `/order/${id}`);
  }
  save();
  return view(state.orders[state.orders.length - 1], "Buyer", me.uid)!;
}

function changeStatus(itemId: number, to: OrderStatus) {
  const me = need();
  const order = state.orders.find((o) => o.items.some((i) => i.id === itemId));
  const item = order?.items.find((i) => i.id === itemId);
  if (!order || !item) throw new ApiError(404, "Order line not found");
  const role = me.role === "Farmer" ? "seller" : "buyer";
  if ((role === "seller" && item.sellerId !== me.uid) || (role === "buyer" && order.buyerId !== me.uid)) throw new ApiError(403, "That isn't your order.");
  const ok: Record<string, OrderStatus[]> =
    role === "buyer" ? { Pending: ["Cancelled"] }
      : { Pending: ["Processing", "Cancelled"], Processing: ["Shipped", "Cancelled"], Shipped: ["Delivered"] };
  if (!ok[item.status]?.includes(to)) throw new ApiError(409, `A ${item.status.toLowerCase()} item can't become ${to.toLowerCase()}.`);
  if (to === "Cancelled" && item.productId) {
    const p = state.products.find((x) => x.id === item.productId);
    if (p) { p.quantityAvailable += item.quantity; p.inStock = true; }
  }
  item.status = to;
  const [target, toUid] = role === "seller" ? (["Buyer", order.buyerId] as const) : (["Farmer", item.sellerId] as const);
  notify(target, toUid, "status", `Order #${order.id}: ${item.productName} ${to.toLowerCase()}`, `Status is now ${to}.`, `/order/${order.id}`);
  save();
}

function postReview(b: Record<string, unknown>) {
  const me = need();
  const itemId = Number(b.orderItemId);
  const order = state.orders.find((o) => o.buyerId === me.uid && o.items.some((i) => i.id === itemId));
  const item = order?.items.find((i) => i.id === itemId);
  if (!order || !item || item.status !== "Delivered" || !item.productId) throw new ApiError(403, "Only delivered items can be reviewed.");
  if (state.reviews.some((r) => r.orderItemId === itemId)) throw new ApiError(409, "You already reviewed this item.");
  const rating = Math.min(5, Math.max(1, Number(b.rating) || 5));
  state.reviews.unshift({ id: ++state.seq.review, productId: item.productId, reviewerName: me.name, rating, comment: String(b.comment ?? ""), created_at: new Date().toISOString(), orderItemId: itemId, reviewerId: me.uid });
  const p = productById(item.productId);
  p.rating = Math.round(((p.rating * p.reviews + rating) / (p.reviews + 1)) * 10) / 10;
  p.reviews += 1;
  notify("Farmer", p.sellerId, "review", "New review", `${me.name} rated ${p.name} ${rating} stars.`, `/product/${p.id}`);
  save();
}

function stats(role: "Buyer" | "Farmer", uid: string) {
  const orders = myOrders(role, uid);
  if (role === "Buyer") {
    return {
      orders: orders.length,
      inProgress: orders.filter((o) => ["Pending", "Processing", "Shipped"].includes(o.status)).length,
      delivered: orders.filter((o) => o.status === "Delivered").length,
      spent: orders.reduce((s, o) => s + (o.items.some(live) ? o.itemsSubtotal + o.shippingAmount : 0), 0),
    };
  }
  const months = new Map<string, number>();
  for (const o of orders) {
    const k = o.created_at.slice(0, 7);
    months.set(k, (months.get(k) ?? 0) + o.itemsSubtotal);
  }
  return {
    orders: orders.length,
    openItems: orders.flatMap((o) => o.items).filter((i) => ["Pending", "Processing", "Shipped"].includes(i.status)).length,
    revenue: orders.reduce((s, o) => s + o.itemsSubtotal, 0),
    months: [...months].map(([month, sales]) => ({ month, sales })),
  };
}

const allReviews = (productId: number): Review[] =>
  [...state.reviews.filter((r) => r.productId === productId), ...mockReviews(productId)];

const fileToDataUrl = (f: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new ApiError(400, "Couldn't read that image."));
    r.readAsDataURL(f);
  });

// ---- router ----------------------------------------------------------------------------------------------------

/** Answers every endpoint the storefront and dashboards use, from demo data held in memory (and localStorage). */
export async function mockRequest<T>(method: string, path: string, params: Params = {}, body?: Body): Promise<T> {
  await new Promise((r) => setTimeout(r, 120)); // so loading states are visible, like a real network
  const b = (body && !(body instanceof Blob) ? body : {}) as Record<string, unknown>;
  const m = (re: RegExp) => path.match(re);
  const out = (v: unknown) => v as T;
  let r: RegExpMatchArray | null;

  if (method === "GET") {
    if (path === "/categories") return out(MOCK_CATEGORIES.map((c) => ({ ...c, productCount: state.products.filter((p) => p.categoryId === c.id).length })));
    if (path === "/config") return out({ shippingPerFarmer: SHIPPING });
    if (path === "/products") return out(listProducts(params));
    if (path === "/products/mine") { const me = need(); return out(paged(state.products.filter((p) => p.sellerId === me.uid), 200)); }
    if ((r = m(/^\/products\/(\d+)$/))) return out(productById(Number(r[1])));
    if (path === "/reviews") return out(paged(allReviews(Number(params.productId)), Number(params.limit) || 5));
    if (path === "/reviews/eligible") {
      const me = need();
      const done = new Set(state.reviews.map((x) => x.orderItemId));
      const items = state.orders.filter((o) => o.buyerId === me.uid).flatMap((o) => o.items)
        .filter((i) => i.productId === Number(params.productId) && i.status === "Delivered" && !done.has(i.id))
        .map((i) => ({ orderItemId: i.id, orderId: i.orderId }));
      return out({ items });
    }
    if (path === "/reviews/mine") {
      const me = need();
      return out({ items: state.reviews.filter((x) => x.reviewerId === me.uid).map((x) => {
        const p = state.products.find((q) => q.id === x.productId);
        return { ...x, productName: p?.name ?? "Product", productImage: p?.imageUrl ?? null };
      }) });
    }
    if (path === "/profile") return out(need());
    if (path === "/orders") { const me = need(); return out(paged(myOrders(me.role, me.uid), Number(params.limit) || 20, Number(params.offset) || 0)); }
    if (path === "/orders/stats") { const me = need(); return out(stats(me.role, me.uid)); }
    if ((r = m(/^\/orders\/(\d+)$/))) {
      const me = need();
      const o = state.orders.find((x) => x.id === Number(r![1]));
      const v = o && view(o, me.role, me.uid);
      if (!v) throw new ApiError(404, "Order not found");
      return out(v);
    }
    if (path === "/notifications") { const me = need(); const items = state.notifications[me.role]; return out({ items, unread: items.filter((n) => !n.read).length }); }
  }

  if (method === "POST") {
    if (path === "/orders") return out(placeOrder(b));
    if (path === "/contact") return out({ ok: true });
    if (path === "/reviews") { postReview(b); return out({ ok: true }); }
    if (path === "/notifications/read-all") { need(); state.notifications[need().role].forEach((n) => (n.read = true)); save(); return out(undefined); }
    if (path === "/products") {
      const me = need();
      if (me.role !== "Farmer") throw new ApiError(403, "Only sellers can list products.");
      const p: Product = { id: ++state.seq.product, name: "", price: 0, unit: "kg", quantityAvailable: 0, inStock: false, categoryId: 1, categoryName: "Vegetables", sellerId: me.uid, sellerName: me.name, productionType: null, imageUrl: null, rating: 0, reviews: 0, created_at: new Date().toISOString() };
      applyProductFields(p, b);
      state.products.unshift(p);
      save();
      return out(p);
    }
    if (path === "/uploads/product-image" && body instanceof Blob) {
      need();
      const url = `https://demo.agrilink.test/uploads/${Date.now()}.jpg`;
      state.uploads[url] = await fileToDataUrl(body);
      return out({ url });
    }
  }

  if (method === "PATCH") {
    if (path === "/profile") { const me = need(); state.profiles[me.role] = { ...state.profiles[me.role], ...(b as Partial<Profile>) }; save(); return out(need()); }
    if ((r = m(/^\/products\/(\d+)$/))) { const p = ownProduct(Number(r[1])); applyProductFields(p, b); save(); return out(p); }
    if ((r = m(/^\/orders\/items\/(\d+)\/status$/))) { changeStatus(Number(r[1]), b.status as OrderStatus); return out({ ok: true }); }
    if ((r = m(/^\/notifications\/(\d+)\/read$/))) { const n = state.notifications[need().role].find((x) => x.id === Number(r![1])); if (n) n.read = true; save(); return out(undefined); }
  }

  if (method === "PUT" && (r = m(/^\/products\/(\d+)\/stock$/))) {
    const p = ownProduct(Number(r[1]));
    applyProductFields(p, { quantityAvailable: b.quantityAvailable });
    save();
    return out(p);
  }

  if (method === "DELETE") {
    if ((r = m(/^\/products\/(\d+)$/))) { ownProduct(Number(r[1])); state.products = state.products.filter((p) => p.id !== Number(r![1])); save(); return out(undefined); }
    if ((r = m(/^\/reviews\/(\d+)$/))) { state.reviews = state.reviews.filter((x) => x.id !== Number(r![1])); save(); return out(undefined); }
  }

  throw new ApiError(404, `Demo mode has no handler for ${method} ${path}.`, "mock");
}
