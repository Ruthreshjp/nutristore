import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaFilter, FaSearch, FaShoppingCart, FaHeart, FaVideo, FaTimes } from 'react-icons/fa';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        console.log('DEBUG: Initial fetch response status:', res.status);
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
        setFilteredProducts(validProducts);
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
    setSearchParams({});
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
      setErrorMessage('');
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
    navigate('/cart', { state: { buyNow: { product, quantity } } });
    setIsModalOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-10 px-4 pt-20">
      <h1 className="text-4xl md:text-5xl font-extrabold text-amber-900 mb-8 text-center animate-pulseTitle tracking-wide">
        Shop Fresh Products 🛒
      </h1>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8 px-4">
        <form onSubmit={handleSearch} className="w-full max-w-md relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-700" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-lg"
          />
        </form>
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg"
        >
          <FaFilter /> Filter
        </button>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl border border-amber-300 shadow-2xl relative animate-bounceIn">
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="absolute top-4 right-4 text-amber-700 hover:text-amber-900 transition-colors duration-300"
            >
              <FaTimes className="text-xl" />
            </button>
            <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">Filter Products</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-amber-900">
              <div>
                <label className="block mb-2 font-medium">Max Price: ₹{priceRange}</label>
                <input
                  type="range"
                  min="1"
                  max={maxPrice}
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Max Quantity: {quantityRange}</label>
                <input
                  type="range"
                  min="1"
                  max={maxQuantity}
                  value={quantityRange}
                  onChange={(e) => setQuantityRange(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block mb-2 font-medium">Harvest Condition</label>
                <select
                  value={harvestFilter}
                  onChange={(e) => setHarvestFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="">All Harvest Conditions</option>
                  <option value="harvested">Harvested</option>
                  <option value="not_harvested">Not Harvested</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={offerOnly}
                    onChange={(e) => setOfferOnly(e.target.checked)}
                    className="mr-2 h-4 w-4 accent-amber-500"
                  />
                  Show only products with offers
                </label>
              </div>

              <div className="col-span-2">
                <label className="block mb-2 font-medium">Expiry Date Before</label>
                <input
                  type="date"
                  value={expiryDateBefore}
                  onChange={(e) => setExpiryDateBefore(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-amber-50 border border-amber-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={clearFilters}
                className="bg-amber-200 hover:bg-amber-300 text-amber-900 px-6 py-2 rounded-lg font-medium transition-colors duration-300"
              >
                Clear Filters
              </button>
              <button
                onClick={applyFilters}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : errorMessage ? (
        <p className="text-center text-red-500 text-lg py-10">{errorMessage}</p>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <FaHeart className="text-amber-400 text-5xl mx-auto mb-4" />
          <p className="text-amber-700 text-lg">No products found matching your criteria.</p>
          <button 
            onClick={clearFilters}
            className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border border-amber-200"
              onClick={() => {
                setSelectedProduct(product);
                setQuantity(1);
                setIsModalOpen(true);
              }}
            >
              <div className="relative h-48 w-full overflow-hidden rounded-lg mb-4">
                <img
                  src={`http://localhost:5000${product.image}`}
                  alt={product.itemName}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                />
                {product.offers && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Offer
                  </div>
                )}
              </div>
              <div className="text-amber-900">
                <h2 className="text-lg font-semibold truncate mb-1">{product.itemName}</h2>
                <p className="text-sm text-amber-700 mb-2">by {product.sellerName}</p>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xl font-bold text-amber-600">₹{product.price}</p>
                  <p className="text-sm text-amber-700">Qty: {product.quantity}</p>
                </div>
                <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2">
                  <FaShoppingCart /> View Details
                </button>

                {product.video && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoProduct(product);
                      setIsVideoModalOpen(true);
                    }}
                    className="mt-2 w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:from-amber-500 hover:to-orange-500 transition-all duration-300"
                  >
                    <FaVideo /> Product Video
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fadeIn z-50">
          {successMessage}
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-amber-300 shadow-2xl relative animate-bounceIn">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedProduct(null);
              }}
              className="absolute top-4 right-4 text-amber-700 hover:text-amber-900 transition-colors duration-300"
            >
              <FaTimes className="text-xl" />
            </button>
            <div className="flex flex-col items-center">
              <img
                src={`http://localhost:5000${selectedProduct.image}`}
                alt={selectedProduct.itemName}
                className="h-48 w-48 object-cover rounded-lg mb-4 border border-amber-200"
              />
              <h2 className="text-2xl font-bold text-amber-900 mb-2 text-center">{selectedProduct.itemName}</h2>
              <p className="text-sm text-amber-700 mb-1">by {selectedProduct.sellerName}</p>
              <p className="text-lg text-amber-600 font-semibold mb-2">₹{selectedProduct.price}</p>
              {selectedProduct.offers && (
                <p className="text-sm text-amber-500 font-semibold mb-1">🏷️ Offer: {selectedProduct.offers}</p>
              )}
              {selectedProduct.expiryDate && (
                <p className="text-sm text-amber-700 mb-1">⏳ Expires on: {new Date(selectedProduct.expiryDate).toLocaleDateString()}</p>
              )}
              <p className="text-sm text-amber-700 mb-1">📍 {selectedProduct.location}</p>
              <p className="text-sm text-amber-700 mb-1">Unit: {selectedProduct.unit}</p>
              <p className="text-sm text-amber-700 mb-1">Available: {selectedProduct.quantity}</p>
              <p className="text-sm text-amber-700 mb-1">Harvest: {selectedProduct.harvestCondition || 'N/A'}</p>
              <p className="text-sm text-amber-700 mb-4">Delivery Time: {selectedProduct.deliveryTime || 'N/A'} days</p>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 w-full">
                <div className="flex items-center gap-2">
                  <label className="text-amber-900 font-medium">Qty:</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Math.min(selectedProduct.quantity, parseInt(e.target.value) || 1)))
                    }
                    className="w-20 px-2 py-1 bg-amber-50 border border-amber-300 rounded-md text-center text-amber-900"
                    min="1"
                    max={selectedProduct.quantity}
                  />
                </div>
                <button
                  onClick={() => handleAddToCart(selectedProduct)}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <FaShoppingCart /> Add to Cart
                </button>
                <button
                  onClick={() => handleBuyNow(selectedProduct)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Buy Now
                </button>
              </div>
              {errorMessage && <p className="text-red-500 text-sm mt-2 text-center">{errorMessage}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {isVideoModalOpen && videoProduct && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 rounded-lg shadow-xl max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-amber-700 hover:text-amber-900"
              onClick={() => {
                setIsVideoModalOpen(false);
                setVideoProduct(null);
              }}
            >
              <FaTimes className="text-xl" />
            </button>
            <h2 className="text-lg font-bold text-amber-900 mb-4 text-center">{videoProduct.itemName} - Video</h2>
            <video controls className="w-full rounded-lg">
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
  @keyframes pulseTitle { 
    0%, 100% { transform: scale(1); } 
    50% { transform: scale(1.03); } 
  }
  .animate-pulseTitle { animation: pulseTitle 2s ease-in-out infinite; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
  @keyframes bounceIn {
    0% { transform: scale(0.9); opacity: 0; }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-bounceIn { animation: bounceIn 0.4s ease-out; }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Products;