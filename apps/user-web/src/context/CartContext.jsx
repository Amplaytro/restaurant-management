import { createContext, useCallback, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({
    type: "dineIn",
    memberCount: 2,
    name: "",
    phoneNumber: "",
    address: "",
  });
  const [cookingInstructions, setCookingInstructions] = useState("");

  const addItem = useCallback((item) => {
    setItems((current) => {
      const existing = current.find((entry) => entry._id === item._id);
      if (existing) {
        return current.map((entry) =>
          entry._id === item._id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }

      return [...current, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    setItems((current) =>
      current
        .map((entry) =>
          entry._id === itemId ? { ...entry, quantity: Math.max(0, entry.quantity - 1) } : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  }, []);

  const updateDraft = useCallback((nextDraft) => {
    setDraft((current) => ({ ...current, ...nextDraft }));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCookingInstructions("");
    setDraft({
      type: "dineIn",
      memberCount: 2,
      name: "",
      phoneNumber: "",
      address: "",
    });
  }, []);

  const value = useMemo(
    () => ({
      items,
      draft,
      cookingInstructions,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      addItem,
      removeItem,
      updateDraft,
      setCookingInstructions,
      clearCart,
    }),
    [addItem, clearCart, cookingInstructions, draft, items, removeItem, updateDraft],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
