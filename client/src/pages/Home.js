import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import fruitsVeggies from '../assets/fruits_veggies.jpg';
import grains from '../assets/grains.jpg';
import pulses from '../assets/pulses.jpg';
import greens from '../assets/greens.jpg';
import farmScene from '../assets/mix.jpg';
import healthyMeal from '../assets/healthy_meal.jpg';
import trustedUsers from '../assets/trusted_users.png'; // Add your image for trusted users
import certifiedProducts from '../assets/certified_products.png'; // Add your image for certified products
import quality100 from '../assets/100_quality.png'; // Add your image for 100% quality
import { useAuth } from '../context/AuthContext';

function Home() {
  const { isAuthenticated } = useAuth();
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const heroImages = [fruitsVeggies, grains, pulses, greens, farmScene, healthyMeal];
  const [products, setProducts] = useState([]);
  const [recentlyVisited, setRecentlyVisited] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Hero carousel effect
  useEffect(() => {
    const heroTimer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(heroTimer);
  }, [heroImages.length]);

  // Fetch products from products page API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Products data:', data); // Debug log
          setProducts(data);
        } else {
          console.warn('No products found, status:', response.status);
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    };
    fetchProducts();
    const interval = setInterval(fetchProducts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Load recently visited products from localStorage
  useEffect(() => {
    const visited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
    setRecentlyVisited(visited.slice(0, 5)); // Limit to 5 items
  }, []);

  const goToPrevHero = () => setCurrentHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  const goToNextHero = () => setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);

  // Add to cart function with success notification
  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!cart.find(item => item._id === product._id)) {
      cart.push({ _id: product._id, name: product.itemName, image: product.image || farmScene });
      localStorage.setItem('cart', JSON.stringify(cart));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center font-sans relative">
      <div className="container mx-auto py-12 px-4">
        {/* Hero Section */}
        <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl mb-16">
          <img
            src={heroImages[currentHeroIndex]}
            alt={`Hero Slide ${currentHeroIndex + 1}`}
            className="w-full h-[500px] object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center text-center p-6">
            <div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-lg mb-4 animate-fadeIn">
                Welcome to Nutri-Store Excellence
              </h1>
              <p className="text-xl sm:text-2xl text-white/90 mb-6 animate-fadeIn">
                Discover the finest organic nutrition from nature’s best farms.
              </p>
              <Link
                to="/products"
                className="inline-block bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Shop Now
              </Link>
            </div>
          </div>
          <button
            onClick={goToPrevHero}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-10 transition-colors"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            onClick={goToNextHero}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-10 transition-colors"
            aria-label="Next"
          >
            →
          </button>
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroIndex(index)}
                className={`w-3 h-3 rounded-full ${index === currentHeroIndex ? 'bg-white' : 'bg-white/50'} transition-colors`}
              />
            ))}
          </div>
        </div>

        {/* Products Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-8 animate-fadeIn">
            Our Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full transform hover:scale-105 duration-300"
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img
                    src={product.image ? `http://localhost:5000${product.image}` : farmScene}
                    alt={product.itemName}
                    className="w-full h-48 object-cover flex-shrink-0 transition-transform duration-300 hover:scale-110"
                  />
                  <div className="p-4 flex-grow">
                    <h3 className="text-lg font-semibold text-gray-700">{product.itemName}</h3>
                    <p className="text-sm text-gray-500">₹{product.price.toFixed(2)}</p>
                    <button
                      onClick={(e) => { e.preventDefault(); addToCart(product); }}
                      className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-sm transition-colors hover:shadow-md"
                    >
                      Add to Cart
                    </button>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">No products available at the moment.</p>
            )}
          </div>
        </section>

        {/* Recently Visited Products */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-8 animate-fadeIn">
            Recently Visited
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recentlyVisited.length > 0 ? (
              recentlyVisited.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full transform hover:scale-105 duration-300"
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img
                    src={product.image ? `http://localhost:5000${product.image}` : healthyMeal}
                    alt={product.name}
                    className="w-full h-48 object-cover flex-shrink-0 transition-transform duration-300 hover:scale-110"
                  />
                  <div className="p-4 flex-grow">
                    <h3 className="text-lg font-semibold text-gray-700">{product.name}</h3>
                    <p className="text-sm text-gray-500">₹{product.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">No recently visited products. Start exploring!</p>
            )}
          </div>
        </section>

        {/* Brand Story Section */}
        <section className="mb-16 bg-gradient-to-br from-green-100 to-teal-50 p-8 rounded-2xl shadow-lg">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-6 animate-fadeIn">
            Our Story
          </h2>
          <p className="text-lg text-gray-700 text-center max-w-3xl mx-auto leading-relaxed">
            At Nutri-Store, we’re passionate about bringing you the purest organic products straight from sustainable farms. With a team of expert nutritionists, we ensure every grain, pulse, and green meets the highest standards of quality and health. Join us on this journey to nourish your body and soul.
          </p>
          <div className="mt-6 text-center">
            <Link
              to="/about"
              className="inline-block bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* Interactive Features Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-8 animate-fadeIn">
            Our Guarantees
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer"
              onClick={() => alert('Trusted by millions of users worldwide!')}
            >
              <img
                src={trustedUsers}
                alt="Trusted Users"
                className="w-full h-48 object-cover rounded-t-xl transition-transform duration-300 hover:scale-110"
              />
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold text-gray-700">Trusted Users</h3>
                <p className="text-sm text-gray-500">Millions of satisfied customers.</p>
              </div>
            </div>
            <div
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer"
              onClick={() => alert('All products are certified organic by experts!')}
            >
              <img
                src={certifiedProducts}
                alt="Certified Products"
                className="w-full h-48 object-cover rounded-t-xl transition-transform duration-300 hover:scale-110"
              />
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold text-gray-700">Certified Products</h3>
                <p className="text-sm text-gray-500">All products are certified organic.</p>
              </div>
            </div>
            <div
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer"
              onClick={() => alert('Guaranteed 100% premium quality for every purchase!')}
            >
              <img
                src={quality100}
                alt="100% Quality"
                className="w-full h-48 object-cover rounded-t-xl transition-transform duration-300 hover:scale-110"
              />
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold text-gray-700">100% Quality</h3>
                <p className="text-sm text-gray-500">Guaranteed premium quality.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fadeIn">
          Product added successfully!
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

  @keyframes scroll-left {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-scroll-left {
    display: flex;
    width: 200%; /* Double the width for seamless loop */
    animation: scroll-left linear infinite;
  }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Home;