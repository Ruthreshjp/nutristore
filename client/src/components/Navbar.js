import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FaBell, FaUserCircle, FaHome, FaSearch, FaShoppingCart } from 'react-icons/fa';

function Navbar() {
  const { user, logout, userType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { hasNewNotifications } = useNotifications();
  const [newOrderCount, setNewOrderCount] = useState(0);

  // Sync search query with URL on page load
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('search') || '';
    setSearchQuery(query);
  }, [location.search]);

  // Fetch order count (pending orders)
  useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/your-orders', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const orders = await response.json();
          const pendingOrders = orders.filter(order => order.status === 'pending');
          setNewOrderCount(pendingOrders.length);
        }
      } catch (err) {
        console.error('Error fetching order count:', err);
      }
    };

    fetchOrderCount();
    const interval = setInterval(fetchOrderCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Clear cart notification when visiting cart page
  useEffect(() => {
    if (location.pathname === '/cart') {
      localStorage.setItem('cartVisited', 'true');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed === '') return;
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    setSearchQuery('');
    setIsMenuOpen(false); // Close mobile menu after search
  };

  const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartVisited = localStorage.getItem('cartVisited') === 'true';

  return (
    <nav className="relative bg-gradient-to-r from-indigo-600/80 to-cyan-400/80 backdrop-blur-md text-white py-4 shadow-lg border-b border-cyan-500/30">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link to={user ? '/home' : '/'} className="text-2xl font-extrabold animate-pulseLogo flex items-center">
          <span className="bg-gradient-to-r from-lime-400 to-teal-300 bg-clip-text text-transparent drop-shadow-md">Nutri</span>
          <span className="bg-gradient-to-r from-fuchsia-400 to-rose-400 bg-clip-text text-transparent drop-shadow-md">-Store</span>
        </Link>
        {user && (
          <>
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center mx-4 space-x-2">
              <FaSearch className="text-white" />
              <input
                type="text"
                placeholder="Search for products"
                className="px-4 py-2 rounded-lg bg-white/80 text-black focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </>
        )}
        <div className="hidden md:flex space-x-6 items-center">
          {user ? (
            <>
              <Link to="/home" className="hover:text-yellow-300 transition duration-300">
                <FaHome className="text-xl" />
              </Link>
              <Link to="/products" className="hover:text-yellow-300 font-bold transition duration-300">Products</Link>
              <Link to="/cart" className="relative hover:text-yellow-300 font-bold transition duration-300">
                <FaShoppingCart className="text-xl inline mr-1" /> Cart
                {cartItems.length > 0 && !cartVisited && <span className="notification-dot" />}
              </Link>
              <Link to="/your-orders" className="relative hover:text-yellow-300 font-bold transition duration-300">
                Your Orders
                {newOrderCount > 0 && <span className="notification-dot" />}
              </Link>
              {userType === 'Producer' && (
                <>
                  <Link to="/sell" className="hover:text-yellow-300 font-bold transition duration-300">Sell</Link>
                  <Link to="/your-products" className="hover:text-yellow-300 font-bold transition duration-300">Your Products</Link>
                </>
              )}
              <Link to="/notifications" className="relative hover:text-yellow-300 transition duration-300">
                <FaBell className="text-xl" />
                {hasNewNotifications && <span className="notification-dot" />}
              </Link>
              <div className="relative">
                <FaUserCircle
                  className="text-2xl cursor-pointer hover:text-yellow-300 transition duration-300"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                />
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-lg shadow-lg z-10">
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-200">Profile</Link>
                    <Link to="/settings" className="block px-4 py-2 hover:bg-gray-200">Settings</Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-green-200 font-bold transition duration-300">Login</Link>
              <Link to="/signup" className="hover:text-green-200 font-bold transition duration-300">Sign Up</Link>
            </>
          )}
        </div>
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800/90 backdrop-blur-md px-4 py-4 space-y-3 animate-slideDown">
          {user && (
            <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
              <FaSearch className="text-white" />
              <input
                type="text"
                placeholder="Search for products"
                className="px-4 py-2 rounded-lg bg-white/80 text-black focus:outline-none focus:ring-2 focus:ring-teal-400 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          )}
          {user ? (
            <>
              <Link to="/home" onClick={() => setIsMenuOpen(false)} className="block hover:text-yellow-300">Home</Link>
              <Link to="/products" onClick={() => setIsMenuOpen(false)} className="block hover:text-yellow-300">Products</Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="relative block hover:text-yellow-300">
                <FaShoppingCart className="text-xl inline mr-1" /> Cart
                {cartItems.length > 0 && !cartVisited && <span className="notification-dot" />}
              </Link>
              <Link to="/your-orders" onClick={() => setIsMenuOpen(false)} className="relative block hover:text-yellow-300">
                Your Orders
                {newOrderCount > 0 && <span className="notification-dot" />}
              </Link>
              {userType === 'Producer' && (
                <>
                  <Link to="/sell" onClick={() => setIsMenuOpen(false)} className="block hover:text-yellow-300">Sell</Link>
                  <Link to="/your-products" onClick={() => setIsMenuOpen(false)} className="block hover:text-yellow-300">Your Products</Link>
                </>
              )}
              <Link to="/notifications" onClick={() => setIsMenuOpen(false)} className="relative block hover:text-yellow-300">
                Notifications
                {hasNewNotifications && <span className="notification-dot" />}
              </Link>
              <button
                onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                className="block text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block hover:text-green-200">Login</Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block hover:text-green-200">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

const styles = `
  @keyframes pulseLogo {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  .animate-pulseLogo {
    animation: pulseLogo 2.5s ease-in-out infinite;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slideDown {
    animation: slideDown 0.3s ease-out;
  }

  .notification-dot {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 10px;
    height: 10px;
    background-color: red;
    border-radius: 50%;
  }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Navbar;