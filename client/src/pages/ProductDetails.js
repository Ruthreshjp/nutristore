import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((err) => setError('Failed to fetch product details.'));
  }, [id]);

  const handleAddToCart = () => {
    if (product && quantity <= product.quantity) {
      addToCart({ ...product, quantity });
      navigate('/cart');
    } else {
      setError('Invalid quantity or out of stock.');
    }
  };

  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!product) return <p className="text-center">Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg">
        <img src={`http://localhost:5000${product.image}`} alt={product.itemName} className="w-full h-64 object-cover rounded-lg mb-4" />
        <h1 className="text-3xl font-bold text-green-700 mb-2">{product.itemName}</h1>
        <p className="text-gray-600 mb-2">Seller: {product.sellerName}</p>
        <p className="text-gray-600 mb-2">Location: {product.location}</p>
        <p className="text-lg font-semibold mb-2">Price: ₹{product.price} / {product.unit}</p>
        <p className="text-gray-600 mb-2">Available: {product.quantity} {product.unit === 'per piece' ? 'pieces' : product.unit}</p>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantity, parseInt(e.target.value) || 1)))}
            className="w-20 p-2 border border-gray-300 rounded"
            min="1"
            max={product.quantity}
          />
        </div>
        <button
          onClick={handleAddToCart}
          className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-full hover:from-green-600 hover:to-blue-600 transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductDetails;