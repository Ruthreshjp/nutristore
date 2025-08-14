import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserEdit, FaBell, FaTrash, FaKey, FaMoneyCheckAlt } from 'react-icons/fa';
import axios from 'axios';

function SettingsPage() {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user?.token) {
      navigate('/login', { replace: true });
      return;
    }
    async function fetchSettings() {
      try {
        const res = await axios.get('http://localhost:5000/api/settings', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setNotifications(res.data.notifications);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load settings');
        console.error('Fetch settings error:', err.response?.data || err.message);
      }
    }
    fetchSettings();
  }, [user, loading, navigate]);

  const handleNotificationsChange = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.put(
        'http://localhost:5000/api/settings',
        { notifications: !notifications },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications(!notifications);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update notifications');
      console.error('Update notifications error:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-900 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-10">
        <div className="bg-gradient-to-r from-indigo-600/80 to-cyan-400/80 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-500/30 p-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-lime-400 to-teal-300 bg-clip-text text-transparent text-center mb-8">
            Settings
          </h1>

          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          {isLoading && <p className="text-cyan-300 text-center mb-4">Updating...</p>}

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaUserEdit className="text-cyan-300 text-xl" />
                <label className="text-lg font-semibold text-cyan-300">Edit Profile</label>
              </div>
              <button
                onClick={() => navigate('/edit-profile', { state: { refreshProfile: true } })}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition duration-300"
                disabled={isLoading}
              >
                Edit
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaBell className="text-cyan-300 text-xl" />
                <label className="text-lg font-semibold text-cyan-300">Notifications</label>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={handleNotificationsChange}
                className="form-checkbox h-5 w-5 text-lime-400 bg-gray-800 border-cyan-500/50 rounded focus:ring-0 focus:ring-offset-0"
                disabled={isLoading}
              />
            </div>

            {userType === 'Producer' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaMoneyCheckAlt className="text-cyan-300 text-xl" />
                  <label className="text-lg font-semibold text-cyan-300">Update Razorpay Bank Details</label>
                </div>
                <button
                  onClick={() => navigate('/update-bank-details', { state: { refreshProfile: true } })}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition duration-300"
                  disabled={isLoading}
                >
                  Update
                </button>
              </div>
            )}

            <div className="pt-6 border-t border-cyan-500/50">
              <button
                onClick={() => navigate('/change-password')}
                className="w-full text-left text-red-400 hover:text-red-300 font-semibold flex items-center gap-3 py-2 hover:underline"
                disabled={isLoading}
              >
                <FaKey className="text-red-400" /> Change Password
              </button>
              <button
                onClick={() => navigate('/delete-account')}
                className="w-full text-left text-red-400 hover:text-red-300 font-semibold flex items-center gap-3 py-2 hover:underline"
                disabled={isLoading}
              >
                <FaTrash className="text-red-400" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;