import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserEdit, FaBell, FaTrash, FaKey, FaMoneyCheckAlt, FaCog, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

function SettingsPage() {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      setSuccess('Notification settings updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update notifications');
      console.error('Update notifications error:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-amber-800 text-xl">Loading your settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 mr-3 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all duration-300"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center">
            <FaCog className="mr-3 text-amber-600" />
            Account Settings
          </h1>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl shadow-md animate-fadeIn">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-xl shadow-md animate-fadeIn">
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Profile Section */}
          <div className="p-6 border-b border-amber-100">
            <h2 className="text-xl font-semibold text-amber-900 mb-4 flex items-center">
              <FaUserEdit className="mr-2 text-amber-600" />
              Profile Settings
            </h2>
            <button
              onClick={() => navigate('/edit-profile', { state: { refreshProfile: true } })}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
              disabled={isLoading}
            >
              Edit Profile Information
            </button>
          </div>

          {/* Preferences Section */}
          <div className="p-6 border-b border-amber-100">
            <h2 className="text-xl font-semibold text-amber-900 mb-4 flex items-center">
              <FaBell className="mr-2 text-amber-600" />
              Preferences
            </h2>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-amber-800">Email Notifications</p>
                <p className="text-sm text-amber-600">Receive updates about your orders and new products</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={handleNotificationsChange}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-12 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Payment Section for Producers */}
          {userType === 'Producer' && (
            <div className="p-6 border-b border-amber-100">
              <h2 className="text-xl font-semibold text-amber-900 mb-4 flex items-center">
                <FaMoneyCheckAlt className="mr-2 text-amber-600" />
                Payment Settings
              </h2>
              <button
                onClick={() => navigate('/update-bank-details', { state: { refreshProfile: true } })}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
                disabled={isLoading}
              >
                Update Bank Details
              </button>
            </div>
          )}

          {/* Security Section */}
          <div className="p-6 border-b border-amber-100">
            <h2 className="text-xl font-semibold text-amber-900 mb-4 flex items-center">
              <FaKey className="mr-2 text-amber-600" />
              Security
            </h2>
            <button
              onClick={() => navigate('/change-password')}
              className="w-full py-3 px-4 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-xl transition-all duration-300 mb-3 flex items-center justify-center"
              disabled={isLoading}
            >
              <FaKey className="mr-2" />
              Change Password
            </button>
          </div>

          {/* Danger Zone */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-red-700 mb-4 flex items-center">
              <FaTrash className="mr-2" />
              Danger Zone
            </h2>
            <p className="text-amber-700 mb-4 text-sm">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => navigate('/delete-account')}
              className="w-full py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center"
              disabled={isLoading}
            >
              <FaTrash className="mr-2" />
              Delete Account
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-amber-800 font-medium">Updating settings...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;