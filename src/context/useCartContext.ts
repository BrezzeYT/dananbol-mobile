import { createContext, useContext } from "react";
import type { Product } from "../types";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  subTotal: number;
  insurance: number;
  shipping: number;
  grandTotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return ctx;
}
