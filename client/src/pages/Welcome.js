import React from 'react';
import { Link } from 'react-router-dom';

function Welcome() {
  const handleLinkClick = (e, path) => {
    console.log(`Attempting to navigate to ${path}`); // Debug log
    // Prevent default only if needed (though Link handles this)
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center animate-fadeIn">
      <h1 className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 drop-shadow-md mb-4 animate-fadeIn">
        Welcome to Nutri-Store
      </h1>
      <p className="text-lg text-gray-700 mb-8">
        Your gateway to fresh and healthy agricultural products!
      </p>
      <div className="flex justify-center gap-4">
        <Link
          to="/login"
          onClick={(e) => handleLinkClick(e, '/login')}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          Login
        </Link>
        <Link
          to="/signup"
          onClick={(e) => handleLinkClick(e, '/signup')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

// Styles
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.8s ease-out;
  }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Welcome;