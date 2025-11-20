import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  isSubscription?: boolean;
  subscriptionFrequency?: 'monthly' | 'bi-monthly' | 'quarterly';
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSubscription: (id: string) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items;
        const existingItem = items.find((i) => i.id === item.id);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      toggleSubscription: (id) => {
        set({
          items: get().items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  isSubscription: !i.isSubscription,
                  subscriptionFrequency: i.isSubscription ? undefined : 'monthly',
                }
              : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      total: () => {
        return get().items.reduce((sum, item) => {
          const price = item.isSubscription ? item.price * 0.85 : item.price; // 15% subscription discount
          return sum + price * item.quantity;
        }, 0);
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'hairwave-cart-storage',
    }
  )
);
