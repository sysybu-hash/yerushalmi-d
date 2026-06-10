"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: number;
  title: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            // פריט קיים — מעלים כמות
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      clearCart: () => set({ items: [] }),

      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "yerushalmi-cart", // מפתח ב־localStorage
    }
  )
);
