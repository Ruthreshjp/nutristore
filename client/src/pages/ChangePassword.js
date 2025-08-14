import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaKey } from 'react-icons/fa';

function ChangePassword() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user?.token) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await axios.put(
        'http://localhost:5000/api/change-password',
        { currentPassword: formData.currentPassword, newPassword: formData.newPassword },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      console.error('Change password error:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative z-10 container mx-auto px-6 py-10">
        <div className="bg-gradient-to-r from-indigo-600/80 to-cyan-400/80 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-500/30 p-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-lime-400 to-teal-300 bg-clip-text text-transparent text-center mb-8">
            Change Password
          </h1>

          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          {isLoading && <p className="text-cyan-300 text-center mb-4">Updating...</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
                required
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 rounded-lg transition duration-300 hover:scale-105"
              >
                {isLoading ? 'Updating...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                disabled={isLoading}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg transition duration-300 hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;