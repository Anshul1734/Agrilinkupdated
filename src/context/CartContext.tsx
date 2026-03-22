import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/types";
import { useAuth } from "./AuthContext";

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Track cart in state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // 1. When user logs in or out, swap to their personal saved cart!
  useEffect(() => {
    if (user === undefined) return; // Wait for auth to settle
    
    const userId = user?.id ? user.id.toString() : 'guest';
    const savedCart = localStorage.getItem(`cart_${userId}`);
    
    if (savedCart) {
      try {
         setCartItems(JSON.parse(savedCart));
      } catch(e) { /* ignore parse error */ }
    } else {
      setCartItems([]); // Empty if they have no saved cart
    }
  }, [user]);

  // 2. Whenever cart changes, save to the CURRENT user's storage
  useEffect(() => {
    if (user === undefined) return;
    const userId = user?.id ? user.id.toString() : 'guest';
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cartItems));
  }, [cartItems, user]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    setCartItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
