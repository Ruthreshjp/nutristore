import React from 'react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} className="w-full h-56 object-cover rounded-t-lg" />
      <div className="p-5">
        <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
        <p className="text-gray-600 text-sm">{product.category}</p>
        <p className="text-green-600 font-bold text-2xl mt-2">₹{product.price}</p>
        <div className="mt-4 flex space-x-3">
          <Link to={`/products/${product._id}`} className="btn">
            View Details
          </Link>
          <button
            onClick={() => addToCart(product)}
            className="btn"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;