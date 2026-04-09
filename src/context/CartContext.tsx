'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useState,
} from 'react';

const STORAGE_KEY = 'phb_cart';

export interface CartItem {
  _id: string;
  productId: string;
  variantId: string;
  ProductName: string;
  variantName: string;
  ProductPrice: number; // The effective calculated price
  basePrice: number;
  price50: number;
  price100: number;
  ProductImage: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  cartHydrated: boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD'; payload: CartItem[] };

function calculateEffectivePrice(item: Partial<CartItem>, quantity: number): number {
  const base = item.basePrice ?? item.ProductPrice ?? 0;
  const p50 = item.price50 ?? base;
  const p100 = item.price100 ?? base;

  if (quantity >= 100) return p100;
  if (quantity >= 50) return p50;
  return base;
}

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.find((item) => item._id === action.payload._id);
      if (existing) {
        return state.map((item) => {
          if (item._id === action.payload._id) {
            const newQuantity = item.quantity + action.payload.quantity;
            return {
              ...item,
              quantity: newQuantity,
              ProductPrice: calculateEffectivePrice(item, newQuantity),
            };
          }
          return item;
        });
      }
      return [...state, { ...action.payload, ProductPrice: calculateEffectivePrice(action.payload, action.payload.quantity) }];
    }
    case 'REMOVE_FROM_CART':
      return state.filter((item) => item._id !== action.payload);
    case 'UPDATE_QUANTITY':
      return state.map((item) =>
        item._id === action.payload.id
          ? { 
              ...item, 
              quantity: action.payload.quantity,
              ProductPrice: calculateEffectivePrice(item, action.payload.quantity),
            }
          : item
      );
    case 'CLEAR_CART':
      return [];
    case 'LOAD':
      return action.payload;
    default:
      return state;
  }
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is CartItem =>
        row &&
        typeof row === 'object' &&
        '_id' in row &&
        'productId' in row &&
        'variantId' in row &&
        'quantity' in row
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [cartHydrated, setCartHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loaded = parseCart(localStorage.getItem(STORAGE_KEY));
    if (loaded.length) dispatch({ type: 'LOAD', payload: loaded });
    setCartHydrated(true);
  }, []);

  useEffect(() => {
    if (!cartHydrated || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, cartHydrated]);

  const addToCart = (item: CartItem) => {
    dispatch({ type: 'ADD_TO_CART', payload: item });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { id, quantity },
      });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartHydrated,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function cartLineId(productId: string, variantId: string) {
  return `${productId}_${variantId}`;
}
