import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { MOCK_ENABLED } from "@/mocks/api";

/** The cart holds only ids and quantities. Prices and stock are always read live from the server. */
export interface CartLine {
  productId: number;
  quantity: number;
}

export interface AddResult {
  added: number;
  /** Why fewer than requested were added: not enough stock, or the cart already has the maximum number of products. */
  reason?: "stock" | "full";
}

interface CartContextType {
  lines: CartLine[];
  cartCount: number;
  addItem: (productId: number, quantity: number, available: number) => AddResult;
  setQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const MAX_PER_LINE = 1000;
/** Matches the API: it accepts at most 50 ids per catalogue request and 50 lines per order. */
export const MAX_CART_LINES = 50;
const keyFor = (uid: string | null) => `agrilink:cart:v2:${uid ?? "guest"}`;

// localStorage is user-editable, so treat what comes out of it as untrusted input.
function readCart(key: string): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(raw)) return [];
    const seen = new Set<number>();
    const lines: CartLine[] = [];
    for (const l of raw) {
      if (!Number.isInteger(l?.productId) || l.productId <= 0 || !Number.isInteger(l?.quantity) || l.quantity <= 0) continue;
      if (seen.has(l.productId)) continue; // duplicate lines would double-count
      seen.add(l.productId);
      lines.push({ productId: l.productId, quantity: Math.min(l.quantity, MAX_PER_LINE) });
      if (lines.length === MAX_CART_LINES) break;
    }
    return lines;
  } catch {
    return [];
  }
}

function writeCart(key: string, lines: CartLine[]) {
  try {
    if (lines.length) localStorage.setItem(key, JSON.stringify(lines));
    else localStorage.removeItem(key);
  } catch {
    /* storage full or blocked: the cart just won't persist */
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, firebaseUser, profile } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  // The source of truth for mutations. React may run state updater functions late, so results
  // (like "how many did we add?") must be computed from this ref, not from inside setState.
  const linesRef = useRef<CartLine[]>([]);
  // The storage key the in-memory cart currently belongs to; null until auth has settled.
  const [owner, setOwner] = useState<string | null>(null);
  const loadedFor = useRef<string | null>(null);

  // Demo mode has no Firebase user, so the demo profile owns the cart instead.
  const uid = (MOCK_ENABLED ? profile?.uid : firebaseUser?.uid) ?? null;

  const commit = useCallback((next: CartLine[]) => {
    linesRef.current = next;
    setLines(next);
  }, []);

  // Switch carts when the signed-in user changes. A guest cart is merged into the user's on sign-in.
  useEffect(() => {
    if (status === "loading") return;
    const key = keyFor(uid);
    let next = readCart(key);
    if (uid) {
      const guestKey = keyFor(null);
      const guest = readCart(guestKey);
      if (guest.length) {
        const merged = new Map(next.map((l) => [l.productId, l.quantity]));
        for (const g of guest) {
          if (!merged.has(g.productId) && merged.size >= MAX_CART_LINES) continue;
          merged.set(g.productId, Math.min((merged.get(g.productId) ?? 0) + g.quantity, MAX_PER_LINE));
        }
        next = [...merged].map(([productId, quantity]) => ({ productId, quantity }));
        writeCart(guestKey, []);
      }
    }
    loadedFor.current = key;
    setOwner(key);
    commit(next);
  }, [status, uid, commit]);

  useEffect(() => {
    if (owner && loadedFor.current === owner) writeCart(owner, lines);
  }, [lines, owner]);

  // Keep several tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (owner && e.key === owner) commit(readCart(owner));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [owner, commit]);

  const addItem = useCallback(
    (productId: number, quantity: number, available: number): AddResult => {
      const prev = linesRef.current;
      const existing = prev.find((l) => l.productId === productId);
      if (!existing && prev.length >= MAX_CART_LINES) return { added: 0, reason: "full" };

      const cap = Math.max(0, Math.min(available, MAX_PER_LINE));
      const current = existing?.quantity ?? 0;
      const target = Math.min(current + quantity, cap);
      const added = target - current;
      if (added <= 0) return { added: 0, reason: "stock" };

      commit(existing ? prev.map((l) => (l.productId === productId ? { ...l, quantity: target } : l)) : [...prev, { productId, quantity: target }]);
      return { added, reason: added < quantity ? "stock" : undefined };
    },
    [commit],
  );

  const setQuantity = useCallback(
    (productId: number, quantity: number) => {
      if (!Number.isInteger(quantity) || quantity < 1) return;
      commit(linesRef.current.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(quantity, MAX_PER_LINE) } : l)));
    },
    [commit],
  );

  const removeItem = useCallback((productId: number) => commit(linesRef.current.filter((l) => l.productId !== productId)), [commit]);
  const clearCart = useCallback(() => commit([]), [commit]);

  const value = useMemo(
    () => ({ lines, cartCount: lines.reduce((n, l) => n + l.quantity, 0), addItem, setQuantity, removeItem, clearCart }),
    [lines, addItem, setQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
