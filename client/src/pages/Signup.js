import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaUserTag } from 'react-icons/fa';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [userType, setUserType] = useState('Producer');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

const handleSignup = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setMessage('');
  try {
    const response = await axios.post('http://localhost:5000/api/signup', {
      username,
      email,
      password,
      mobileNumber,
      userType,
    });
    setMessage(response.data.message);
    if (response.data.message === 'Signup successful') {
      setTimeout(() => navigate('/login'), 1500);
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data || error.message || 'An unexpected error occurred';
    console.log('Full error response:', error.response?.data);
    if (typeof errorMsg === 'string' && errorMsg.includes('already exists')) {
      setMessage('Signup error: A user with this email and user type already exists. Try a different email or switch user type.');
    } else {
      setMessage(`Signup error: ${errorMsg}`);
    }
    console.error('Signup error details:', error.response?.data || error);
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-200 transform transition-all duration-700 animate-fadeIn">
        {/* Decorative elements */}
        <div className="absolute -top-3 -left-3 w-12 h-12 bg-amber-400/20 rounded-full blur-sm"></div>
        <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-orange-400/20 rounded-full blur-sm"></div>
        <div className="absolute top-2 right-2 w-8 h-8 bg-amber-300/30 rounded-full"></div>

        <h1 className="text-3xl font-bold text-amber-900 mb-6 text-center">
          Create Your Account
        </h1>
        <p className="text-center text-amber-600 mb-4">Select your role: Farmer or Consumer</p>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Username */}
          <div className="relative">
            <label className="block text-amber-800 mb-2 font-medium">Username <span className="text-red-500">*</span></label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 z-10" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 placeholder-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="relative">
            <label className="block text-amber-800 mb-2 font-medium">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 placeholder-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                placeholder="Enter email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-amber-800 mb-2 font-medium">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 z-10" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 placeholder-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="relative">
            <label className="block text-amber-800 mb-2 font-medium">Mobile Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 z-10" />
              <PhoneInput
                international
                defaultCountry="IN"
                value={mobileNumber}
                onChange={setMobileNumber}
                className="phone-input w-full pl-10 border border-amber-300 rounded-xl bg-amber-50"
                placeholder="Enter mobile number"
                required
              />
            </div>
          </div>

          {/* User Type Selection */}
          <div className="relative">
            <label className="block text-amber-800 mb-2 font-medium">User Type <span className="text-red-500">*</span></label>
            <div className="relative">
              <FaUserTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 z-10" />
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none transition-all duration-300"
                required
              >
                <option value="Producer">Farmer</option>
                <option value="Consumer">Consumer</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-1">Note: You can sign up with the same email as a different user type.</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing up...
              </div>
            ) : (
              'Sign Up'
            )}
          </button>

          {message && (
            <div className={`p-3 rounded-xl text-center ${
              message.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <p className="text-center text-amber-700 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors duration-300">
              Login here
            </Link>
          </p>
        </form>

        {/* Custom style for PhoneInput */}
        <style>
          {`
            .phone-input .PhoneInputInput {
              background-color: #fffbeb !important;
              color: #78350f !important;
              padding: 14px 14px 14px 0;
              font-size: 16px;
              width: 100%;
              border: none;
              outline: none;
              border-radius: 12px;
            }
            .phone-input .PhoneInputInput::placeholder {
              color: #d97706;
            }
            .phone-input .PhoneInputCountrySelect {
              background-color: #fffbeb;
              color: #78350f;
              border-radius: 8px;
              margin-right: 8px;
            }
            .phone-input .PhoneInputCountryIcon {
              border-radius: 4px;
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default Signup;