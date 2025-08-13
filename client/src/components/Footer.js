import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram } from '@mui/icons-material';

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
    <footer className="bg-gradient-to-r from-indigo-600/80 to-cyan-400/80 backdrop-blur-md text-white py-6 mt-auto relative overflow-hidden">
      <div className="container mx-auto text-center">
        {/* Shimmering Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>

        <div className="relative z-10">
          <div className="mb-4 animate-fadeIn">
            <Link to="/" className="text-xl font-bold hover:text-green-200 transition-colors duration-300">Nutri-Store</Link>
          </div>
          <div className="mb-4 space-y-2 animate-fadeIn delay-100">
            <p>Contact Us: <a href="mailto:support@nutristore.com" className="hover:text-green-200">support@nutristore.com</a> | MADE IN INDIA</p>
            <p>Address: <span className="hover:text-green-200">Contact Ruthresh</span></p>
          </div>
          <div className="flex justify-center space-x-6 mb-4 animate-fadeIn delay-200">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon hover:text-gray-300">
              <Facebook />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon hover:text-gray-300">
              <Twitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon hover:text-gray-300">
              <Instagram />
            </a>
          </div>
          <p className="text-sm animate-fadeIn delay-300">© 2025 Nutri-Store. All rights reserved.</p>
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
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
  .animate-fadeIn.delay-100 {
    animation-delay: 0.1s;
  }
  .animate-fadeIn.delay-200 {
    animation-delay: 0.2s;
  }
  .animate-fadeIn.delay-300 {
    animation-delay: 0.3s;
  }
  @keyframes bounceIcon {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  .social-icon {
    animation: bounceIcon 2s infinite;
  }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Footer;