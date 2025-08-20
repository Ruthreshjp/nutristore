import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaHeart } from 'react-icons/fa';

function Footer() {
  useEffect(() => {
    const animateIcons = () => {
      const icons = document.querySelectorAll('.social-icon');
      icons.forEach((icon, index) => {
        icon.style.animationDelay = `${index * 0.2}s`;
      });
    };
    animateIcons();
  }, []);

  return (
    <footer className="bg-gradient-to-r from-amber-600 to-orange-500 text-white py-8 mt-auto relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-300 rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-300 rounded-full translate-x-20 translate-y-20"></div>
      </div>
      
      {/* Shimmering effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/20 to-transparent animate-shimmer"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="text-center md:text-left animate-fadeIn">
            <Link to="/" className="text-2xl font-bold flex items-center justify-center md:justify-start mb-4">
              <span className="text-white">Nutri</span>
              <span className="text-amber-200">Store</span>
            </Link>
            <p className="text-amber-100 mb-4">
              Providing the finest organic products straight from nature's best farms to your table.
            </p>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon p-2 bg-amber-500/30 rounded-full hover:bg-amber-500/50 transition-all duration-300">
                <FaFacebook className="text-lg" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon p-2 bg-amber-500/30 rounded-full hover:bg-amber-500/50 transition-all duration-300">
                <FaTwitter className="text-lg" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon p-2 bg-amber-500/30 rounded-full hover:bg-amber-500/50 transition-all duration-300">
                <FaInstagram className="text-lg" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left animate-fadeIn delay-100">
            <h3 className="text-xl font-semibold mb-4 text-amber-200">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-amber-100 hover:text-white transition-colors duration-300">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-amber-100 hover:text-white transition-colors duration-300">
                  cart
                </Link>
              </li>
              <li>
                <Link to="/your-orders" className="text-amber-100 hover:text-white transition-colors duration-300">
                  orders
                </Link>
              </li>
              <li>
                <Link to="/your-products" className="text-amber-100 hover:text-white transition-colors duration-300">
                  products
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left animate-fadeIn delay-200">
            <h3 className="text-xl font-semibold mb-4 text-amber-200">Contact Us</h3>
            <div className="space-y-2 text-amber-100">
              <p>
                <a href="mailto:support@nutristore.com" className="hover:text-white transition-colors duration-300">
                  support@nutristore.com
                </a>
              </p>
              <p>MADE WITH <FaHeart className="inline text-amber-300 animate-pulse" /> IN INDIA</p>
              <p className="hover:text-white transition-colors duration-300">
                Address: Contact Ruthresh
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-amber-400/30 pt-6 text-center animate-fadeIn delay-300">
          <p className="text-amber-100">
            © 2025 Nutri-Store. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Styles
const styles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 3s infinite linear;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
  }
  .animate-fadeIn.delay-100 {
    animation-delay: 0.2s;
  }
  .animate-fadeIn.delay-200 {
    animation-delay: 0.4s;
  }
  .animate-fadeIn.delay-300 {
    animation-delay: 0.6s;
  }
  @keyframes bounceIcon {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  .social-icon {
    animation: bounceIcon 2s infinite;
  }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Footer;