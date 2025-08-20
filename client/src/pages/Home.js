import React, { useState, useEffect, useRef } from 'react';
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
  const heroRef = useRef(null);
  const productsContainerRef = useRef(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isScrolling, setIsScrolling] = useState(true);

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hero carousel effect
  useEffect(() => {
    const heroTimer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(heroTimer);
  }, [heroImages.length]);

  // Auto-scroll products
  useEffect(() => {
    if (!productsContainerRef.current || latestProducts.length === 0) return;
    
    const container = productsContainerRef.current;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    // Only auto-scroll if content overflows
    if (scrollWidth <= clientWidth) return;
    
    let scrollInterval;
    
    if (isScrolling) {
      scrollInterval = setInterval(() => {
        if (container.scrollLeft >= scrollWidth - clientWidth) {
          // Smoothly reset to start when reaching the end
          container.scrollTo({
            left: 0,
            behavior: 'smooth'
          });
        } else {
          // Smooth scroll to the right
          container.scrollBy({
            left: 1,
            behavior: 'smooth'
          });
        }
      }, 30);
    }
    
    return () => {
      if (scrollInterval) clearInterval(scrollInterval);
    };
  }, [latestProducts, isScrolling]);

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

  // Handle image load for hero section
  const handleHeroLoad = () => {
    setHeroLoaded(true);
  };

  // Handle mouse events for products scrolling
  const handleMouseEnter = () => setIsScrolling(false);
  const handleMouseLeave = () => setIsScrolling(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center font-sans relative pt-16">
      {/* Full screen background */}
      <div className="fixed inset-0 bg-gradient-to-br from-amber-50 to-orange-100 -z-10"></div>
      
      {error && (
        <div className="fixed top-20 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fadeIn z-50">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-white hover:text-red-200"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="container mx-auto py-12 px-4 w-full">
        {/* Hero Section */}
        <div 
          ref={heroRef}
          className="relative w-full max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl mb-16 group"
        >
          <img
            src={heroImages[currentHeroIndex]}
            alt={`Hero Slide ${currentHeroIndex + 1}`}
            className={`w-full h-[550px] object-cover transition-all duration-1000 ${
              heroLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            }`}
            onLoad={handleHeroLoad}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/70 to-transparent flex items-center justify-center text-center p-8">
            <div className="transform transition-all duration-700 group-hover:scale-105">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white drop-shadow-2xl mb-6 animate-fadeIn">
                Welcome to <span className="text-amber-300">Nutri-Store</span>
              </h1>
              <p className="text-lg md:text-xl lg:text-3xl text-amber-100 mb-8 animate-fadeIn delay-300">
                Discover the finest organic nutrition from nature's best farms.
              </p>
              <Link
                to="/products"
                className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-8 py-3 md:px-10 md:py-4 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 animate-bounce-light"
              >
                Shop All Products
              </Link>
            </div>
          </div>
          <button
            onClick={goToPrevHero}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-amber-900/60 hover:bg-amber-900/80 text-amber-100 p-2 md:p-4 rounded-full z-10 transition-all duration-300 group-hover:opacity-100 opacity-0 md:opacity-100"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            onClick={goToNextHero}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-amber-900/60 hover:bg-amber-900/80 text-amber-100 p-2 md:p-4 rounded-full z-10 transition-all duration-300 group-hover:opacity-100 opacity-0 md:opacity-100"
            aria-label="Next"
          >
            →
          </button>
          <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3 z-10">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroIndex(index)}
                className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 ${
                  index === currentHeroIndex 
                    ? 'bg-amber-400 scale-125' 
                    : 'bg-amber-100/40 hover:bg-amber-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Our Products Section */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-amber-900 text-center mb-8 md:mb-10 animate-fadeIn">
            Our <span className="text-amber-600">Products</span>
          </h2>
          {latestProducts.length > 0 ? (
            <div 
              className="relative overflow-hidden w-full group"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleMouseEnter}
              onTouchEnd={handleMouseLeave}
            >
              <div 
                ref={productsContainerRef}
                className="flex overflow-x-auto pb-4 hide-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
              >
                {[...latestProducts, ...latestProducts].map((product, index) => (
                  <div
                    key={`${product._id}-${index}`}
                    className="flex-none w-56 md:w-64 mx-2 md:mx-3 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:-translate-y-2 hover:scale-105"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="overflow-hidden">
                      <img
                        src={product.image ? `http://localhost:5000${product.image}` : farmScene}
                        alt={product.itemName}
                        className="w-full h-40 object-cover transition-transform duration-500 hover:scale-110"
                        onError={(e) => {
                          e.target.src = farmScene;
                          console.log('Image load failed, using fallback:', farmScene);
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-md font-semibold text-amber-900 truncate">{product.itemName}</h3>
                      <p className="text-sm text-amber-700">₹{product.price?.toFixed(2) || 'N/A'} / {product.unit || 'unit'}</p>
                      {product.offers && <p className="text-amber-600 text-xs truncate">{product.offers}</p>}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Gradient fade effects on sides */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-amber-50 to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-amber-50 to-transparent pointer-events-none"></div>
            </div>
          ) : (
            <p className="text-center text-amber-700 text-lg">No products available at this moment. Check back later.</p>
          )}
          <div className="text-center mt-6 md:mt-8">
            <Link
              to="/products"
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-6 py-2 md:px-8 md:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              View all products
            </Link>
          </div>
        </section>

        {/* Brand Story Section */}
        <section className="mb-16 md:mb-20 bg-gradient-to-br from-amber-100 to-orange-100 p-6 md:p-8 lg:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute -top-16 -right-16 md:-top-24 md:-right-24 w-40 h-40 md:w-64 md:h-64 bg-amber-300/20 rounded-full"></div>
          <div className="absolute -bottom-16 -left-16 md:-bottom-24 md:-left-24 w-40 h-40 md:w-64 md:h-64 bg-orange-300/20 rounded-full"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-amber-900 text-center mb-6 md:mb-8 animate-fadeIn">
              Our <span className="text-amber-600">Story</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-amber-800 text-center max-w-4xl mx-auto leading-relaxed">
              At Nutri-Store, we're passionate about bringing you the purest organic products straight from sustainable farms. With a team of expert nutritionists, we ensure every grain, pulse, and green meets the highest standards of quality and health. Join us on this journey to nourish your body and soul.
            </p>
            <div className="mt-6 md:mt-8 text-center">
              <Link
                to="/products"
                className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-6 py-2 md:px-8 md:py-3 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Explore
              </Link>
            </div>
          </div>
        </section>

        {/* Interactive Features Section */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-amber-900 text-center mb-8 md:mb-10 animate-fadeIn">
            Our <span className="text-amber-600">Guarantees</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-3 cursor-pointer group overflow-hidden"
              onClick={() => alert('Trusted by millions of users worldwide!')}
            >
              <div className="overflow-hidden">
                <img
                  src={trustedUsers}
                  alt="Trusted Users"
                  className="w-full h-48 md:h-64 object-cover rounded-t-2xl transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-4 md:p-5 text-center">
                <h3 className="text-lg md:text-xl font-semibold text-amber-900 group-hover:text-amber-700 transition-colors duration-300">Trusted Users</h3>
                <p className="text-sm md:text-md text-amber-700">Millions of satisfied customers.</p>
              </div>
            </div>
            <div
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-3 cursor-pointer group overflow-hidden"
              onClick={() => alert('All products are certified organic by experts!')}
            >
              <div className="overflow-hidden">
                <img
                  src={certifiedProducts}
                  alt="Certified Products"
                  className="w-full h-48 md:h-64 object-cover rounded-t-2xl transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-4 md:p-5 text-center">
                <h3 className="text-lg md:text-xl font-semibold text-amber-900 group-hover:text-amber-700 transition-colors duration-300">Certified Products</h3>
                <p className="text-sm md:text-md text-amber-700">All products are certified organic.</p>
              </div>
            </div>
            <div
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-3 cursor-pointer group overflow-hidden"
              onClick={() => alert('Guaranteed 100% premium quality for every purchase!')}
            >
              <div className="overflow-hidden">
                <img
                  src={quality100}
                  alt="100% Quality"
                  className="w-full h-48 md:h-64 object-cover rounded-t-2xl transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-4 md:p-5 text-center">
                <h3 className="text-lg md:text-xl font-semibold text-amber-900 group-hover:text-amber-700 transition-colors duration-300">100% Quality</h3>
                <p className="text-sm md:text-md text-amber-700">Guaranteed premium quality.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-20 right-4 bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fadeIn z-50">
          Product added successfully!
          <button
            onClick={() => setShowSuccess(false)}
            className="ml-4 text-white hover:text-amber-200"
          >
            ×
          </button>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        .group:hover .animate-scroll {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export default Home;