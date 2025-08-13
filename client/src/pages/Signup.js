import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [userType, setUserType] = useState('Producer'); // Default selection
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
        userType, // ✅ Send userType to backend
      });
      setMessage(response.data.message);
      if (response.data.message === 'Signup successful! Please login.') {
        navigate('/login');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'An unexpected error occurred';
      setMessage(`Signup error: ${errorMsg}`);
      console.error('Signup error details:', error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md p-6 bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl border border-blue-500/30 transform transition-all duration-700 animate-bounceIn">
      <div className="absolute -top-4 -left-4 w-16 h-16 bg-blue-500/20 rounded-full blur-md animate-pulse"></div>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-purple-500/20 rounded-full blur-md animate-pulse delay-1000"></div>

      <h1 className="text-4xl font-extrabold text-blue-400 mb-6 text-center tracking-wide animate-pulseLogo">
        Sign Up
      </h1>

      <form onSubmit={handleSignup} className="space-y-5">
        {/* Username */}
        <div className="relative">
          <label className="block text-blue-300 mb-2 font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-14 p-3 bg-gray-800 border border-blue-500/30 rounded-lg text-white"
            placeholder="Enter username"
            required
          />
        </div>

        {/* Email */}
        <div className="relative">
          <label className="block text-blue-300 mb-2 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 p-3 bg-gray-800 border border-blue-500/30 rounded-lg text-white"
            placeholder="Enter email"
            required
          />
        </div>

        {/* Password */}
        <div className="relative">
          <label className="block text-blue-300 mb-2 font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-14 p-3 bg-gray-800 border border-blue-500/30 rounded-lg text-white"
            placeholder="Enter password"
            required
          />
        </div>

        {/* Mobile Number */}
        <div className="relative">
          <label className="block text-blue-300 mb-2 font-medium">Mobile Number</label>
          <PhoneInput
            international
            defaultCountry="IN"
            value={mobileNumber}
            onChange={setMobileNumber}
            className="phone-input w-full h-14 border border-blue-500/30 rounded-lg"
            placeholder="Enter mobile number"
            required
          />
        </div>

        {/* ✅ User Type Selection */}
        <div className="relative">
          <label className="block text-blue-300 mb-2 font-medium">User Type</label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="w-full h-14 p-3 bg-gray-800 border border-blue-500/30 rounded-lg text-white"
            required
          >
            <option value="Producer">Producer</option>
            <option value="Consumer">Consumer</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105"
        >
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </button>

        {message && <p className="text-center text-gray-300 mt-4">{message}</p>}
        <p className="text-center text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300">Login</Link>
        </p>
      </form>

      {/* ✅ Custom style for PhoneInput */}
      <style>
        {`
          .phone-input input {
            background-color: #1f2937 !important; /* bg-gray-800 */
            color: white !important;
            padding: 14px;
            font-size: 16px;
            width: 100%;
            border: none;
            outline: none;
          }
          .phone-input input::placeholder {
            color: #9ca3af;
          }
        `}
      </style>
    </div>
  );
}

export default Signup;
