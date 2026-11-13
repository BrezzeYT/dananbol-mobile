import React, { useState, useCallback, useMemo, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product } from "../types";
import { CartContext, type CartItem } from "./useCartContext";

const CART_STORAGE_KEY = "danabol_cart_items";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as CartItem[];
            if (Array.isArray(parsed)) {
              setItems(
                parsed.filter(
                  (i) =>
                    i &&
                    i.product &&
                    typeof i.product.id === "number" &&
                    i.product.name &&
                    typeof i.product.price === "number" &&
                    typeof i.quantity === "number" &&
                    i.quantity > 0
                )
              );
            }
          } catch (e) {
            console.warn("Failed to parse cart from storage", e);
          }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Save cart to AsyncStorage when items change
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch(
      (e) => console.warn("Failed to save cart", e)
    );
  }, [items, loaded]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const maxQty = product.quantity ?? Infinity;
        const newQty = Math.min(existing.quantity + quantity, maxQty);
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: newQty } : i
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        const maxQty = i.product.quantity ?? Infinity;
        return { ...i, quantity: Math.min(quantity, maxQty) };
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (productId: number) => items.some((i) => i.product.id === productId),
    [items]
  );

  const totalCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  const insurance = Math.floor(subTotal * 0.03);
  const shipping = 1190;
  const grandTotal = subTotal + insurance + shipping;

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subTotal,
        insurance,
        shipping,
        grandTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
