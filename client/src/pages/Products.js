import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

function Products() {
  const { token, refreshToken } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [priceRange, setPriceRange] = useState(100000);
  const [quantityRange, setQuantityRange] = useState(1000);
  const [harvestFilter, setHarvestFilter] = useState('');
  const [offerOnly, setOfferOnly] = useState(false);
  const [expiryDateBefore, setExpiryDateBefore] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoProduct, setVideoProduct] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync search term with URL
  useEffect(() => {
    const query = searchParams.get('search') || '';
    setSearchTerm(query);
  }, [searchParams]);

  // Fetch products with authentication and token refresh
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let res = await fetch(`http://localhost:5000/api/products?search=${encodeURIComponent(searchTerm)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('DEBUG: Initial fetch response status:', res.status); // Debug log
        if (!res.ok && res.status === 401 && refreshToken) {
          console.log('DEBUG: Token refresh triggered');
          const newToken = await refreshToken();
          if (newToken) {
            res = await fetch(`http://localhost:5000/api/products?search=${encodeURIComponent(searchTerm)}`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            console.log('DEBUG: Refreshed token fetch response status:', res.status);
          } else {
            throw new Error('Authentication failed. Please log in again.');
          }
        }
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        console.log('DEBUG: Products data received:', data);
        const validProducts = data.filter(p => p.itemName && p.image && p.quantity > 0);
        setProducts(validProducts);
        setFilteredProducts(validProducts); // Initial filter set to all fetched products
      } catch (error) {
        console.error('DEBUG: Error fetching products:', error);
        setErrorMessage('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token, refreshToken, searchTerm]);

  // Apply filters whenever filter states change
  useEffect(() => {
    const filtered = products.filter(product => {
      const matchSearch = product.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPrice = product.price <= priceRange;
      const matchQty = product.quantity <= quantityRange;
      const matchHarvest = harvestFilter === ''
        ? true
        : harvestFilter === 'harvested'
        ? product.harvestCondition === 'harvested'
        : product.harvestCondition !== 'harvested';
      const matchOffer = offerOnly ? product.offers?.trim() !== '' : true;
      const matchExpiry = expiryDateBefore
        ? new Date(product.expiryDate) <= new Date(expiryDateBefore)
        : true;

      return matchSearch && matchPrice && matchQty && matchHarvest && matchOffer && matchExpiry;
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, priceRange, quantityRange, harvestFilter, offerOnly, expiryDateBefore]);

  const maxPrice = useMemo(() => {
    return products.reduce((max, p) => (p.price > max ? p.price : max), 1);
  }, [products]);

  const maxQuantity = useMemo(() => {
    return products.reduce((max, p) => (p.quantity > max ? p.quantity : max), 1);
  }, [products]);

  const applyFilters = () => {
    const filtered = products.filter(product => {
      const matchSearch = product.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPrice = product.price <= priceRange;
      const matchQty = product.quantity <= quantityRange;
      const matchHarvest = harvestFilter === ''
        ? true
        : harvestFilter === 'harvested'
        ? product.harvestCondition === 'harvested'
        : product.harvestCondition !== 'harvested';
      const matchOffer = offerOnly ? product.offers?.trim() !== '' : true;
      const matchExpiry = expiryDateBefore
        ? new Date(product.expiryDate) <= new Date(expiryDateBefore)
        : true;

      return matchSearch && matchPrice && matchQty && matchHarvest && matchOffer && matchExpiry;
    });

    setFilteredProducts(filtered);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setPriceRange(maxPrice);
    setQuantityRange(maxQuantity);
    setHarvestFilter('');
    setOfferOnly(false);
    setExpiryDateBefore('');
    setSearchTerm('');
    setFilteredProducts(products);
    setIsFilterModalOpen(false);
    setSearchParams({}); // Clear URL search params
  };

  const handleAddToCart = async (product) => {
    if (quantity > product.quantity) {
      setErrorMessage('Requested quantity exceeds available stock!');
      return;
    }

    if (!addToCart) {
      console.error('DEBUG: addToCart function is not available in CartContext');
      setErrorMessage('Internal error. Please refresh the page or log in again.');
      return;
    }

    try {
      const currentToken = token || localStorage.getItem('token');
      if (!currentToken) throw new Error('No valid token available');

      const response = await fetch(`http://localhost:5000/api/add-to-cart/${product._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ quantity }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to add to cart');

      const updatedProducts = products.map(p =>
        p._id === product._id ? { ...p, quantity: p.quantity - quantity } : p
      ).filter(p => p.quantity > 0);

      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts.filter(p => 
        p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        p.price <= priceRange &&
        p.quantity <= quantityRange &&
        (harvestFilter === '' ? true : harvestFilter === 'harvested' ? p.harvestCondition === 'harvested' : p.harvestCondition !== 'harvested') &&
        (offerOnly ? p.offers?.trim() !== '' : true) &&
        (expiryDateBefore ? new Date(p.expiryDate) <= new Date(expiryDateBefore) : true)
      ));
      addToCart({ ...product, quantity });
      setIsModalOpen(false);
      setSuccessMessage('Product added to cart successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setErrorMessage(''); // Clear any previous error
    } catch (error) {
      console.error('DEBUG: Error adding to cart:', error);
      setErrorMessage(error.message || 'Error updating cart. Please try again.');
    }
  };

  const handleBuyNow = (product) => {
    if (quantity > product.quantity) {
      setErrorMessage('Requested quantity exceeds available stock!');
      return;
    }
    // Navigate to cart with buy-now state
    navigate('/cart', { state: { buyNow: { product, quantity } } });
    setIsModalOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-50 py-10 px-4">
      <h1 className="text-5xl font-extrabold text-green-400 mb-12 text-center animate-pulseTitle tracking-wide">
        Shop Fresh Products 🛒
      </h1>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6 px-4">
        <form onSubmit={handleSearch} className="w-full max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-2 text-gray-100 bg-gray-800 border border-blue-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </form>
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
        >
          Filter
        </button>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900/90 rounded-xl p-6 w-full max-w-xl border border-blue-500/30 shadow-2xl relative animate-bounceIn">
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="absolute top-2 right-2 text-white hover:text-red-500 transition-colors duration-300"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Filter Products</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white">
              <div>
                <label>Max Price: ₹{priceRange}</label>
                <input
                  type="range"
                  min="1"
                  max={maxPrice}
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label>Max Quantity: {quantityRange}</label>
                <input
                  type="range"
                  min="1"
                  max={maxQuantity}
                  value={quantityRange}
                  onChange={(e) => setQuantityRange(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="col-span-2">
                <label>Harvest Condition</label>
                <select
                  value={harvestFilter}
                  onChange={(e) => setHarvestFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-blue-500/30 rounded px-3 py-2"
                >
                  <option value="">All Harvest Conditions</option>
                  <option value="harvested">Harvested</option>
                  <option value="not_harvested">Not Harvested</option>
                </select>
              </div>

              <div className="col-span-2">
                <label>
                  <input
                    type="checkbox"
                    checked={offerOnly}
                    onChange={(e) => setOfferOnly(e.target.checked)}
                    className="mr-2"
                  />
                  Show only products with offers
                </label>
              </div>

              <div className="col-span-2">
                <label>Expiry Date Before</label>
                <input
                  type="date"
                  value={expiryDateBefore}
                  onChange={(e) => setExpiryDateBefore(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-blue-500/30"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={clearFilters}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <p className="text-center text-gray-300 text-lg">Loading products...</p>
      ) : errorMessage ? (
        <p className="text-center text-red-500 text-lg">{errorMessage}</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-gray-300 text-lg">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border border-blue-500/30"
              onClick={() => {
                setSelectedProduct(product);
                setQuantity(1);
                setIsModalOpen(true);
              }}
            >
              <div className="relative h-48 w-full overflow-hidden rounded-lg">
                <img
                  src={`http://localhost:5000${product.image}`}
                  alt={product.itemName}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
              <div className="mt-4 text-green-400">
                <h2 className="text-lg font-semibold truncate">{product.itemName}</h2>
                <p className="text-sm text-gray-300">by {product.sellerName}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xl font-bold text-green-400">₹{product.price}</p>
                  {product.offers && (
                    <span className="text-sm bg-yellow-200 text-yellow-800 font-semibold px-2 py-1 rounded">
                      {product.offers}
                    </span>
                  )}
                </div>
                <button className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-2 rounded-md hover:from-blue-700 hover:to-purple-800 transition-all duration-300 hover:scale-105">
                  View Details
                </button>

                {product.video && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoProduct(product);
                      setIsVideoModalOpen(true);
                    }}
                    className="mt-2 w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-2 rounded-md flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-800 transition-all duration-300 hover:scale-105"
                  >
                    ▶ Product Video
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg animate-fadeIn z-50">
          {successMessage}
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900/80 rounded-xl p-6 w-full max-w-md border border-blue-500/30 shadow-2xl relative animate-bounceIn">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedProduct(null);
              }}
              className="absolute top-2 right-2 text-white hover:text-red-500 transition-colors duration-300"
            >
              ✕
            </button>
            <div className="flex flex-col items-center">
              <img
                src={`http://localhost:5000${selectedProduct.image}`}
                alt={selectedProduct.itemName}
                className="h-48 w-48 object-cover rounded-lg mb-4"
              />
              <h2 className="text-2xl font-bold text-blue-400 mb-2">{selectedProduct.itemName}</h2>
              <p className="text-sm text-gray-300 mb-1">by {selectedProduct.sellerName}</p>
              <p className="text-lg text-green-400 font-semibold mb-2">₹{selectedProduct.price}</p>
              {selectedProduct.offers && (
                <p className="text-sm text-yellow-400 font-semibold mb-1">🏷️ Offer: {selectedProduct.offers}</p>
              )}
              {selectedProduct.expiryDate && (
                <p className="text-sm text-gray-400 mb-1">⏳ Expires on: {new Date(selectedProduct.expiryDate).toLocaleDateString()}</p>
              )}
              <p className="text-sm text-gray-400 mb-1">📍 {selectedProduct.location}</p>
              <p className="text-sm text-gray-400 mb-1">Unit: {selectedProduct.unit}</p>
              <p className="text-sm text-gray-300 mb-1">Available: {selectedProduct.quantity}</p>
              <p className="text-sm text-gray-400 mb-1">Harvest: {selectedProduct.harvestCondition || 'N/A'}</p>
              <p className="text-sm text-gray-400 mb-2">Delivery Time: {selectedProduct.deliveryTime || 'N/A'} days</p>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(selectedProduct.quantity, parseInt(e.target.value) || 1)))
                  }
                  className="w-20 px-2 py-1 bg-gray-800 border border-blue-500/30 rounded-md text-center text-gray-200"
                  min="1"
                  max={selectedProduct.quantity}
                />
                <button
                  onClick={() => handleAddToCart(selectedProduct)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                  disabled={loading}
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => handleBuyNow(selectedProduct)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Buy Now
                </button>
                {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {isVideoModalOpen && videoProduct && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-4 rounded-lg shadow-xl max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-white hover:text-red-500"
              onClick={() => {
                setIsVideoModalOpen(false);
                setVideoProduct(null);
              }}
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-white mb-4">{videoProduct.itemName} - Video</h2>
            <video controls className="w-full rounded-md">
              <source src={`http://localhost:5000${videoProduct.video}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}

// Inject animation styles
const styles = `
  @keyframes pulseTitle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  .animate-pulseTitle { animation: pulseTitle 2.5s ease-in-out infinite; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
  @keyframes bounceIn {
    0% { transform: scale(0.7); opacity: 0; }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-bounceIn { animation: bounceIn 0.5s ease-out; }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Products;