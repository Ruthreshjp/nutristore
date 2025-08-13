import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpMode, setIsOtpMode] = useState(false);
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
        // ✅ Save token, userType, username to context
        login(response.data.token, response.data.userType, response.data.username);
        setMessage('✅ Login successful!');
        navigate('/home');
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
    <div className="relative w-full max-w-md p-6 bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl border border-blue-500/30 animate-bounceIn mx-auto mt-20">
      <h1 className="text-4xl font-extrabold text-blue-400 mb-6 text-center animate-pulseLogo">
        Login to Nutri-Store
      </h1>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-blue-300 mb-2 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-blue-500/30 rounded-lg text-gray-200"
            placeholder="Enter email"
            required
          />
        </div>

        {/* Password (Only in normal mode) */}
        {!isOtpMode && (
          <div>
            <label className="block text-blue-300 mb-2 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-blue-500/30 rounded-lg text-gray-200"
              placeholder="Enter password"
              required
            />
          </div>
        )}

        {/* OTP (Only in OTP mode) */}
        {isOtpMode && (
          <div>
            <label className="block text-blue-300 mb-2 font-medium">OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-blue-500/30 rounded-lg text-gray-200"
              placeholder="Enter OTP"
              required
            />
          </div>
        )}

        {/* User Type */}
        <div>
          <label className="block text-blue-300 mb-2 font-medium">User Type</label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-blue-500/30 rounded-lg text-gray-200"
          >
            <option value="Producer">Producer</option>
            <option value="Consumer">Consumer</option>
          </select>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 rounded-lg"
        >
          {isLoading ? 'Logging in...' : isOtpMode ? 'Login with OTP' : 'Login'}
        </button>

        {/* Resend OTP Button (Only in OTP mode) */}
        {isOtpMode && (
          <button
            type="button"
            onClick={handleSendOtp}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg mt-2"
          >
            Resend OTP
          </button>
        )}

        {message && <p className="text-center text-sm text-gray-300 mt-3">{message}</p>}

        <p className="text-center text-gray-400 mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-purple-400 hover:text-purple-300">
            Sign up
          </Link>
        </p>

        {/* Toggle Mode */}
        <p
          className="text-center text-purple-400 cursor-pointer hover:underline mt-2"
          onClick={() => {
            const newOtpMode = !isOtpMode;
            setIsOtpMode(newOtpMode);
            setPassword('');
            setOtp('');
            setMessage('');

            if (newOtpMode && email) {
              handleSendOtp(); // ✅ Auto send OTP when switching
            }
          }}
        >
          {isOtpMode ? 'Use password instead' : 'Login with OTP'}
        </p>
      </form>
    </div>
  );
}

export default Login;
