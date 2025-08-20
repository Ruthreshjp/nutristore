import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUserTag } from 'react-icons/fa';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState('Producer');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const endpoint = isOtpMode ? 'verify-otp' : 'login';
      const payload = isOtpMode
        ? { email, otp, userType }
        : { email, password, userType };

      const response = await axios.post(`http://localhost:5000/api/${endpoint}`, payload);

      if (response.data.token) {
        login(response.data.token, response.data.userType, response.data.username);
        setMessage('✅ Login successful!');
        setTimeout(() => navigate('/home'), 1000);
      } else {
        setMessage(response.data.message || 'Login failed.');
      }
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Login error.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) return setMessage('Please enter your email.');

    try {
      const response = await axios.post('http://localhost:5000/api/send-otp', { email });
      setMessage(response.data.message || 'OTP sent to your email.');
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Failed to send OTP.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-200 animate-fadeIn">
        {/* Decorative elements */}
        <div className="absolute -top-3 -right-3 w-6 h-6 bg-amber-400 rounded-full"></div>
        <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-orange-400 rounded-full"></div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-amber-900 mb-6 text-center">
          Welcome to <span className="text-orange-600">Nutri-Store</span>
        </h1>
        <p className="text-amber-700 text-center mb-8">Sign in to access your account</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="relative">
            <label className="block text-amber-800 mb-2 font-medium">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password (Only in normal mode) */}
          {!isOtpMode && (
            <div className="relative">
              <label className="block text-amber-800 mb-2 font-medium">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-600 hover:text-amber-800"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          )}

          {/* OTP (Only in OTP mode) */}
          {isOtpMode && (
            <div className="relative">
              <label className="block text-amber-800 mb-2 font-medium">OTP</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Enter OTP sent to your email"
                  required
                />
              </div>
            </div>
          )}

          {/* User Type */}
          <div className="relative">
            <label className="block text-amber-800 mb-2 font-medium">User Type</label>
            <div className="relative">
              <FaUserTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 z-10" />
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="Producer">Producer</option>
                <option value="Consumer">Consumer</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-600 pointer-events-none">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-75 disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : isOtpMode ? 'Login with OTP' : 'Login'}
          </button>

          {/* Resend OTP Button (Only in OTP mode) */}
          {isOtpMode && (
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full bg-amber-400 hover:bg-amber-500 text-amber-900 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              Resend OTP
            </button>
          )}

          {message && (
            <div className={`p-3 rounded-xl text-center ${message.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          <p className="text-center text-amber-700 mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-orange-600 hover:text-orange-700 font-semibold">
              Sign up
            </Link>
          </p>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                const newOtpMode = !isOtpMode;
                setIsOtpMode(newOtpMode);
                setPassword('');
                setOtp('');
                setMessage('');

                if (newOtpMode && email) {
                  handleSendOtp();
                }
              }}
              className="text-amber-600 hover:text-orange-600 font-medium text-sm"
            >
              {isOtpMode ? 'Use password instead' : 'Login with OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;