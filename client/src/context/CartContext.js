import React, { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.find((item) => item._id === action.payload._id);
      if (existingItem) {
        return state.map((item) =>
          item._id === action.payload._id
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
      }
      return [...state, { ...action.payload, quantity: action.payload.quantity || 1 }];
    case 'REMOVE_FROM_CART':
      return state.filter((item) => item._id !== action.payload);
    case 'CLEAR_CART':
      return [];
    case 'UPDATE_QUANTITY':
      return state.map((item) =>
        item._id === action.payload.itemId
          ? { ...item, quantity: Math.max(1, action.payload.quantity) }
          : item
      );
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, []);

  const addToCart = (product, quantity = 1) => {
    dispatch({ type: 'ADD_TO_CART', payload: { ...product, quantity } });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity,
    dispatch, // Expose dispatch for custom actions if needed
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const useCartDispatch = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartDispatch must be used within a CartProvider');
  }
  return context.dispatch;
};