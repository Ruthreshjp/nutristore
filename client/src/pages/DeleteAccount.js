import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';

function DeleteAccount() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user?.token) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.delete('http://localhost:5000/api/delete-account', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      logout();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      console.error('Delete account error:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-10">
        <div className="bg-gradient-to-r from-indigo-600/80 to-cyan-400/80 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-500/30 p-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-lime-400 to-teal-300 bg-clip-text text-transparent text-center mb-8">
            Delete Account
          </h1>

          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          {isLoading && <p className="text-cyan-300 text-center mb-4">Deleting...</p>}

          <div className="text-center">
            <p className="text-gray-200 mb-6">
              Are you sure you want to delete your account? This action is irreversible and will remove all your data, including products and orders.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg transition duration-300 hover:scale-105"
              >
                {isLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => navigate('/settings')}
                disabled={isLoading}
                className="bg-gray-700 text-white py-3 px-6 rounded-lg transition duration-300 hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccount;