"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { LocalCartItem, Perfume } from "@/lib/types";

interface CartContextValue {
  items: LocalCartItem[];
  addItem: (perfume: Perfume, quantity?: number) => void;
  removeItem: (perfumeId: number) => void;
  updateQuantity: (perfumeId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "rosewood_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<LocalCartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((perfume: Perfume, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.perfume_id === perfume.id);
      if (existing) {
        return prev.map((i) =>
          i.perfume_id === perfume.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { perfume_id: perfume.id, quantity, perfume }];
    });
  }, []);

  const removeItem = useCallback((perfumeId: number) => {
    setItems((prev) => prev.filter((i) => i.perfume_id !== perfumeId));
  }, []);

  const updateQuantity = useCallback((perfumeId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.perfume_id !== perfumeId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.perfume_id === perfumeId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.perfume.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
