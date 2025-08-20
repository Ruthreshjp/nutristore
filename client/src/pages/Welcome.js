import React from 'react';
import { Link } from 'react-router-dom';

function Welcome() {
  const handleLinkClick = (e, path) => {
    console.log(`Attempting to navigate to ${path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-amber-300/20 rounded-full animate-float"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-300/20 rounded-full animate-float delay-1000"></div>
      <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-amber-400/30 rounded-full animate-float delay-2000"></div>
      <div className="absolute bottom-1/3 left-1/4 w-20 h-20 bg-orange-400/30 rounded-full animate-float delay-1500"></div>
      
      <div className="bg-white/90 backdrop-blur-lg border border-amber-200 rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full text-center animate-fadeIn relative overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-br-full opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-amber-400 to-orange-500 rounded-tl-full opacity-20"></div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 drop-shadow-md mb-4 animate-fadeIn">
          Welcome to <span className="block mt-1">Nutri-Store</span>
        </h1>
        <p className="text-lg text-amber-700 mb-8">
          Your gateway to fresh and healthy organic products!
        </p>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
            <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">✓</span>
            </div>
            <p className="text-sm text-amber-700">100% Organic</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
            <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">🚚</span>
            </div>
            <p className="text-sm text-amber-700">Fast Delivery</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
            <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">⭐</span>
            </div>
            <p className="text-sm text-amber-700">Premium Quality</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
            <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">🌱</span>
            </div>
            <p className="text-sm text-amber-700">Farm Fresh</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/login"
            onClick={(e) => handleLinkClick(e, '/login')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex-1 text-center"
          >
            Login
          </Link>
          <Link
            to="/signup"
            onClick={(e) => handleLinkClick(e, '/signup')}
            className="bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex-1 text-center"
          >
            Sign Up
          </Link>
        </div>
        
        {/* Bottom decorative element */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full mt-6"></div>
      </div>
    </div>
  );
}

// Styles
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.8s ease-out;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(5deg); }
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .delay-1000 {
    animation-delay: 1s;
  }
  .delay-1500 {
    animation-delay: 1.5s;
  }
  .delay-2000 {
    animation-delay: 2s;
  }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Welcome;