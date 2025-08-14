import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import fruitsVeggies from '../assets/fruits_veggies.jpg';
import grains from '../assets/grains.jpg';
import pulses from '../assets/pulses.jpg';
import greens from '../assets/greens.jpg';
import farmScene from '../assets/mix.jpg';
import healthyMeal from '../assets/healthy_meal.jpg';
import trustedUsers from '../assets/trusted_users.png';
import certifiedProducts from '../assets/certified_products.png';
import quality100 from '../assets/100_quality.png';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { isAuthenticated, token, refreshToken } = useAuth();
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const heroImages = [fruitsVeggies, grains, pulses, greens, farmScene, healthyMeal];
  const [latestProducts, setLatestProducts] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Hero carousel effect
  useEffect(() => {
    const heroTimer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(heroTimer);
  }, [heroImages.length]);

  // Fetch latest products
  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const headers = isAuthenticated ? { Authorization: `Bearer ${token}` } : {};
        let response = await fetch('http://localhost:5000/api/products?sort=createdAt&limit=8', {
          headers,
        });
        if (!response.ok && response.status === 401 && isAuthenticated && refreshToken) {
          console.log('DEBUG: Token refresh triggered');
          const newToken = await refreshToken();
          if (newToken) {
            response = await fetch('http://localhost:5000/api/products?sort=createdAt&limit=8', {
              headers: { Authorization: `Bearer ${newToken}` },
            });
          } else {
            throw new Error('Authentication failed after refresh. Please log in again.');
          }
        }
        if (!response.ok) {
          console.warn('DEBUG: Fetch failed, status:', response.status, 'response:', await response.text());
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('DEBUG: Latest products data received:', data);
        const validProducts = Array.isArray(data)
          ? data.filter(p => p && p.itemName && p.price && p.quantity > 0)
          : [];
        setLatestProducts(validProducts.length > 0 ? validProducts : []);
      } catch (error) {
        console.error('DEBUG: Error fetching latest products:', error.message);
        setLatestProducts([]);
        setError('Failed to load latest products. Please try again later.');
      }
    };

    fetchLatestProducts();
    const interval = setInterval(fetchLatestProducts, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token, refreshToken]);

  const goToPrevHero = () => setCurrentHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  const goToNextHero = () => setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);

  // Navigate to product page with search query
  const handleProductClick = (product) => {
    navigate(`/products?search=${encodeURIComponent(product.itemName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center font-sans relative">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fadeIn">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-white hover:text-red-200"
          >
            ×
          </button>
        </div>
      )}
      <div className="container mx-auto py-12 px-4">
        {/* Hero Section */}
        <div className="relative w-full max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-xl mb-16">
          <img
            src={heroImages[currentHeroIndex]}
            alt={`Hero Slide ${currentHeroIndex + 1}`}
            className="w-full h-[550px] object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center text-center p-8">
            <div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-2xl mb-6 animate-fadeIn">
                Welcome to Nutri-Store Excellence
              </h1>
              <p className="text-xl md:text-3xl text-white/90 mb-8 animate-fadeIn">
                Discover the finest organic nutrition from nature’s best farms.
              </p>
              <Link
                to="/products"
                className="inline-block bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold px-10 py-4 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
              >
                Shop All Products
              </Link>
            </div>
          </div>
          <button
            onClick={goToPrevHero}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-4 rounded-full z-10 transition-all duration-300"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            onClick={goToNextHero}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-4 rounded-full z-10 transition-all duration-300"
            aria-label="Next"
          >
            →
          </button>
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-10">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroIndex(index)}
                className={`w-4 h-4 rounded-full ${index === currentHeroIndex ? 'bg-white' : 'bg-white/40'} hover:bg-white transition-all duration-300`}
              />
            ))}
          </div>
        </div>

        {/* Our Products Section */}
        <section className="mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 text-center mb-10 animate-fadeIn">
            Our Products
          </h2>
          {latestProducts.length > 0 ? (
            <div className="relative overflow-hidden w-full">
              <div className="flex animate-scroll">
                {[...latestProducts, ...latestProducts].map((product, index) => (
                  <div
                    key={`${product._id}-${index}`}
                    className="flex-none w-64 mx-2 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl"
                    onClick={() => handleProductClick(product)}
                  >
                    <img
                      src={product.image ? `http://localhost:5000${product.image}` : farmScene}
                      alt={product.itemName}
                      className="w-full h-40 object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.src = farmScene;
                        console.log('Image load failed, using fallback:', farmScene);
                      }}
                    />
                    <div className="p-4">
                      <h3 className="text-md font-semibold text-gray-800 truncate">{product.itemName}</h3>
                      <p className="text-sm text-gray-600">₹{product.price?.toFixed(2) || 'N/A'} / {product.unit || 'unit'}</p>
                      {product.offers && <p className="text-green-600 text-xs truncate">{product.offers}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-lg">No products available at this moment. Check back later.</p>
          )}
          <div className="text-center mt-4">
            <Link
              to="/products"
              className="text-teal-600 hover:text-teal-800 font-semibold underline"
            >
              View all products
            </Link>
          </div>
        </section>

        {/* Brand Story Section */}
        <section className="mb-20 bg-gradient-to-br from-green-100 to-teal-50 p-8 md:p-12 rounded-3xl shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 text-center mb-8 animate-fadeIn">
            Our Story
          </h2>
          <p className="text-lg md:text-xl text-gray-700 text-center max-w-4xl mx-auto leading-relaxed">
            At Nutri-Store, we’re passionate about bringing you the purest organic products straight from sustainable farms. With a team of expert nutritionists, we ensure every grain, pulse, and green meets the highest standards of quality and health. Join us on this journey to nourish your body and soul.
          </p>
          <div className="mt-8 text-center">
            <Link
              to="/about"
              className="inline-block bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* Interactive Features Section */}
        <section className="mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 text-center mb-10 animate-fadeIn">
            Our Guarantees
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
              onClick={() => alert('Trusted by millions of users worldwide!')}
            >
              <img
                src={trustedUsers}
                alt="Trusted Users"
                className="w-full h-64 object-cover rounded-t-2xl transition-transform duration-300 hover:scale-105"
              />
              <div className="p-5 text-center">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">Trusted Users</h3>
                <p className="text-md md:text-lg text-gray-600">Millions of satisfied customers.</p>
              </div>
            </div>
            <div
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
              onClick={() => alert('All products are certified organic by experts!')}
            >
              <img
                src={certifiedProducts}
                alt="Certified Products"
                className="w-full h-64 object-cover rounded-t-2xl transition-transform duration-300 hover:scale-105"
              />
              <div className="p-5 text-center">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">Certified Products</h3>
                <p className="text-md md:text-lg text-gray-600">All products are certified organic.</p>
              </div>
            </div>
            <div
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
              onClick={() => alert('Guaranteed 100% premium quality for every purchase!')}
            >
              <img
                src={quality100}
                alt="100% Quality"
                className="w-full h-64 object-cover rounded-t-2xl transition-transform duration-300 hover:scale-105"
              />
              <div className="p-5 text-center">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">100% Quality</h3>
                <p className="text-md md:text-lg text-gray-600">Guaranteed premium quality.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fadeIn">
          Product added successfully!
          <button
            onClick={() => setShowSuccess(false)}
            className="ml-4 text-white hover:text-green-200"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// Styles (injected at runtime)
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.7s ease-out forwards;
  }
  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-scroll {
    display: flex;
    animation: scroll 20s linear infinite;
    width: fit-content;
  }
  .animate-scroll:hover {
    animation-play-state: paused;
  }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Home;