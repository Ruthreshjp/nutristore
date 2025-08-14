import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Import AuthContext to check authentication

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Access authentication state
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!isAuthenticated) {
        setError('Please log in to view product details.');
        navigate('/login');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token missing.');
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
        }

        const data = await response.json();
        setProduct(data);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Error fetching product:', err.message);
        if (err.message.includes('401') || err.message.includes('403')) {
          setError('Authentication failed. Please log in again.');
          navigate('/login');
        } else if (err.message.includes('404')) {
          setError('Product not found.');
          navigate('/products'); // Redirect to products list
        } else {
          setError('Failed to fetch product details.');
        }
      }
    };

    fetchProduct();
  }, [id, isAuthenticated, navigate]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setError('Please log in to add items to cart.');
      navigate('/login');
      return;
    }

    if (product && quantity <= product.quantity) {
      addToCart({ ...product, quantity });
      navigate('/cart');
    } else {
      setError('Invalid quantity or out of stock.');
    }
  };

  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;
  if (!product) return <p className="text-center py-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg">
        <img
          src={product.image ? `http://localhost:5000${product.image}` : '/path/to/fallback-image.jpg'} // Update fallback path
          alt={product.itemName}
          className="w-full h-64 object-cover rounded-lg mb-4"
          onError={(e) => { e.target.src = '/path/to/fallback-image.jpg'; }} // Fallback image
        />
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