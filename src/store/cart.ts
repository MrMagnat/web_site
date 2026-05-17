import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id:       string;
  productId: string;
  name:     string;
  image:    string;
  price:    number;
  size?:    string;
  color?:   string;
  qty:      number;
}

interface CartState {
  items:       CartItem[];
  isOpen:      boolean;
  promoCode:   string | null;
  discount:    number; // процент

  // Actions
  openCart:    () => void;
  closeCart:   () => void;
  addItem:     (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  removeItem:  (id: string) => void;
  updateQty:   (id: string, qty: number) => void;
  clearCart:   () => void;
  applyPromo:  (code: string, percent: number) => void;
  removePromo: () => void;

  // Computed helpers (не zustand selectors, просто утилиты)
  total:       () => number;
  subtotal:    () => number;
  count:       () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items:     [],
      isOpen:    false,
      promoCode: null,
      discount:  0,

      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (item) =>
        set((state) => {
          const key = `${item.productId}-${item.size ?? ""}-${item.color ?? ""}`;
          const existing = state.items.find(
            (i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.color === item.color
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, id: key, qty: item.qty ?? 1 }],
          };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),

      clearCart: () => set({ items: [], promoCode: null, discount: 0 }),

      applyPromo: (code, percent) =>
        set({ promoCode: code, discount: percent }),

      removePromo: () => set({ promoCode: null, discount: 0 }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      total: () => {
        const sub = get().subtotal();
        const disc = get().discount;
        return disc > 0 ? sub * (1 - disc / 100) : sub;
      },

      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: "andrua-cart",
      partialize: (state) => ({
        items:     state.items,
        promoCode: state.promoCode,
        discount:  state.discount,
      }),
    }
  )
);
