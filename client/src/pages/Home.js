import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import fruitsVeggies from '../assets/fruits_veggies.jpg';
import grains from '../assets/grains.jpg';
import pulses from '../assets/pulses.jpg';
import greens from '../assets/greens.jpg';
import farmScene from '../assets/mix.jpg';
import healthyMeal from '../assets/healthy_meal.jpg';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [fruitsVeggies, grains, pulses, greens, farmScene, healthyMeal];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex flex-col items-center">
      <div className="container mx-auto py-10 px-4">
        {/* Carousel Section */}
        <div className="relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
          <img
            src={images[currentIndex]}
            alt={`Slide ${currentIndex + 1}`}
           className="w-full h-[400px] object-cover animate-fadeIn"
            style={{ animationDelay: '0.1s' }}
          />
          {/* Controls */}
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10"
            aria-label="Next"
          >
            →
          </button>
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentIndex ? 'bg-green-500' : 'bg-white/70'
                } transition-colors`}
              />
            ))}
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mt-12 px-4">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 drop-shadow-md mb-4 animate-fadeIn">
            Welcome to Nutri-Store
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-8 animate-fadeIn">
            Discover premium farm products: grains, millets, pulses, greens, and more.
          </p>
          <Link
            to="/products"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
          >
            Explore Products
          </Link>
        </div>
      </div>
    </div>
  );
}

// Styles (injected at runtime)
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); opacity: 1; }
  }
  .animate-fadeIn {
    animation: fadeIn 0.7s ease-out forwards;
  }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Home;
