import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';

function CartItem({ item }) {
  const { removeFromCart } = useContext(CartContext);

  return (
    <div className="flex items-center border-b py-4">
      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
      <div className="flex-1 ml-4">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <p className="text-gray-600">₹{item.price}</p>
      </div>
      <button
        onClick={() => removeFromCart(item._id)}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Remove
      </button>
    </div>
  );
}

export default CartItem;