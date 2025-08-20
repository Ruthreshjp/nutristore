import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FaBell, FaUserCircle, FaHome, FaSearch, FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa';

function Navbar() {
  const { user, logout, userType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { hasNewNotifications } = useNotifications();
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navbarRef = useRef(null);
  const navScrollRef = useRef(null);

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => document.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

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
        if (!token || !user) return;

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

    if (user) {
      fetchOrderCount();
      const interval = setInterval(fetchOrderCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Clear cart notification when visiting cart page
  useEffect(() => {
    if (location.pathname === '/cart' && user) {
      localStorage.setItem('cartVisited', 'true');
    }
  }, [location.pathname, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileMenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed === '' || !user) return;
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    setSearchQuery('');
    setIsMenuOpen(false);
  };

  const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartVisited = localStorage.getItem('cartVisited') === 'true';

  return (
    <nav 
      ref={navbarRef}
      className={`fixed top-0 w-full transition-all duration-500 z-50 ${
        scrolled 
          ? 'bg-gradient-to-r from-amber-700 to-orange-600 py-2 shadow-xl' 
          : 'bg-gradient-to-r from-amber-600 to-orange-500 py-3 shadow-lg'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link 
          to={user ? '/home' : '/'} 
          className="text-2xl font-extrabold flex items-center group"
        >
          <span className="text-white drop-shadow-md">Nutri</span>
          <span className="text-amber-200 drop-shadow-md">Store</span>
        </Link>
        
        {user && !isMobile && (
          <>
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center mx-4 space-x-2 flex-1 max-w-xl">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-700 z-10" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="pl-10 pr-4 py-2 w-full rounded-xl bg-white/95 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-lg transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </>
        )}
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-4 items-center">
          {!user ? (
            <>
              <Link 
                to="/login" 
                className="px-4 py-2 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/home" 
                className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-white transition-all duration-300 group relative"
                title="Home"
              >
                <FaHome className="text-xl" />
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
              
              <Link 
                to="/products" 
                className="px-3 py-2 rounded-xl font-bold text-white hover:bg-amber-500/30 transition-all duration-300"
              >
                Products
              </Link>
              
              <Link 
                to="/cart" 
                className="relative px-3 py-2 rounded-xl font-bold text-white hover:bg-amber-500/30 transition-all duration-300 group"
              >
                <FaShoppingCart className="inline mr-1" /> Cart
                {cartItems.length > 0 && !cartVisited && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </Link>
              
              <Link 
                to="/your-orders" 
                className="relative px-3 py-2 rounded-xl font-bold text-white hover:bg-amber-500/30 transition-all duration-300"
              >
                Orders
                {newOrderCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </Link>
              
              {userType === 'Producer' && (
                <>
                  <Link 
                    to="/sell" 
                    className="px-3 py-2 rounded-xl font-bold text-white hover:bg-amber-500/30 transition-all duration-300"
                  >
                    Sell
                  </Link>
                  <Link 
                    to="/your-products" 
                    className="px-3 py-2 rounded-xl font-bold text-white hover:bg-amber-500/30 transition-all duration-300"
                  >
                    Your Products
                  </Link>
                </>
              )}
              
              <Link 
                to="/notifications" 
                className="relative p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-white transition-all duration-300 group"
                title="Notifications"
              >
                <FaBell className="text-xl" />
                {hasNewNotifications && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
              
              <div className="relative">
                <div 
                  className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-white transition-all duration-300 cursor-pointer group"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  title="Profile"
                >
                  <FaUserCircle className="text-xl" />
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </div>
                
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-3 text-gray-800 hover:bg-amber-50 transition-all duration-300"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      className="block px-4 py-3 text-gray-800 hover:bg-amber-50 transition-all duration-300"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-300"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-2 rounded-lg bg-amber-500/30 focus:outline-none transition-all duration-300"
          >
            {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-amber-700 px-4 py-4 space-y-3 animate-slideDown">
          {!user ? (
            <>
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)} 
                className="block px-4 py-3 rounded-xl bg-amber-500 text-white font-bold text-center transition-all duration-300"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                onClick={() => setIsMenuOpen(false)} 
                className="block px-4 py-3 rounded-xl bg-orange-500 text-white font-bold text-center transition-all duration-300"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="flex items-center mb-3">
                <div className="relative w-full">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-700 z-10" />
                  <input
                    type="text"
                    placeholder="Search for products..."
                    className="pl-10 pr-4 py-2 w-full rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
              
              {/* Horizontal scrolling nav for mobile */}
              <div className="overflow-x-auto pb-2 -mx-2 px-2" ref={navScrollRef}>
                <div className="flex space-x-2 w-max">
                  <Link 
                    to="/home" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex items-center px-4 py-2 rounded-xl bg-amber-500/20 text-white transition-all duration-300 whitespace-nowrap"
                  >
                    <FaHome className="mr-2" /> Home
                  </Link>
                  
                  <Link 
                    to="/products" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="px-4 py-2 rounded-xl bg-amber-500/20 text-white font-medium transition-all duration-300 whitespace-nowrap"
                  >
                    Products
                  </Link>
                  
                  <Link 
                    to="/cart" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="relative px-4 py-2 rounded-xl bg-amber-500/20 text-white font-medium transition-all duration-300 whitespace-nowrap"
                  >
                    <FaShoppingCart className="inline mr-1" /> Cart
                    {cartItems.length > 0 && !cartVisited && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    )}
                  </Link>
                  
                  <Link 
                    to="/your-orders" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="relative px-4 py-2 rounded-xl bg-amber-500/20 text-white font-medium transition-all duration-300 whitespace-nowrap"
                  >
                    Orders
                    {newOrderCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    )}
                  </Link>
                  
                  {userType === 'Producer' && (
                    <>
                      <Link 
                        to="/sell" 
                        onClick={() => setIsMenuOpen(false)} 
                        className="px-4 py-2 rounded-xl bg-amber-500/20 text-white font-medium transition-all duration-300 whitespace-nowrap"
                      >
                        Sell
                      </Link>
                      <Link 
                        to="/your-products" 
                        onClick={() => setIsMenuOpen(false)} 
                        className="px-4 py-2 rounded-xl bg-amber-500/20 text-white font-medium transition-all duration-300 whitespace-nowrap"
                      >
                        Your Products
                      </Link>
                    </>
                  )}
                  
                  <Link 
                    to="/notifications" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="relative px-4 py-2 rounded-xl bg-amber-500/20 text-white font-medium transition-all duration-300 whitespace-nowrap"
                  >
                    <FaBell className="inline mr-1" /> Notifications
                    {hasNewNotifications && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    )}
                  </Link>
                </div>
              </div>
              
              <div className="border-t border-amber-500/30 pt-3 mt-2">
                <Link 
                  to="/profile" 
                  onClick={() => setIsMenuOpen(false)} 
                  className="block px-4 py-2 rounded-xl text-white hover:bg-amber-500/30 transition-all duration-300"
                >
                  Profile
                </Link>
                <Link 
                  to="/settings" 
                  onClick={() => setIsMenuOpen(false)} 
                  className="block px-4 py-2 rounded-xl text-white hover:bg-amber-500/30 transition-all duration-300"
                >
                  Settings
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 rounded-xl text-amber-200 hover:bg-amber-500/30 transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;