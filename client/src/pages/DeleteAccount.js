import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaTrash, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

function DeleteAccount() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-200 rounded-full mb-4"></div>
            <div className="h-6 bg-amber-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-amber-100 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
            <div className="w-16 h-16 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-amber-100 text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white">Delete Account</h1>
            <p className="text-amber-100 mt-2">This action cannot be undone</p>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
                <FaExclamationTriangle className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {isLoading && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-6 text-center">
                Deleting your account...
              </div>
            )}

            {!showConfirmation ? (
              <>
                <div className="bg-amber-50 p-4 rounded-lg mb-6">
                  <p className="text-amber-800 font-medium flex items-start">
                    <FaExclamationTriangle className="text-amber-500 mr-2 mt-1 flex-shrink-0" />
                    Warning: This action is permanent
                  </p>
                  <ul className="text-amber-700 text-sm mt-2 space-y-1 ml-6">
                    <li>• All your data will be permanently deleted</li>
                    <li>• Your products will be removed from the marketplace</li>
                    <li>• Your order history will be erased</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowConfirmation(true)}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    <FaTrash className="mr-2" />
                    Continue to Delete
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
                  >
                    <FaArrowLeft className="mr-2" />
                    Go Back
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                  <p className="text-red-800 font-bold text-center">
                    Are you absolutely sure?
                  </p>
                  <p className="text-red-700 text-sm mt-2 text-center">
                    This will permanently delete your account and all associated data.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg disabled:opacity-70 disabled:transform-none flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Deleting Account...
                      </>
                    ) : (
                      <>
                        <FaTrash className="mr-2" />
                        Yes, Delete My Account
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowConfirmation(false)}
                    disabled={isLoading}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
                  >
                    <FaArrowLeft className="mr-2" />
                    No, Take Me Back
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="bg-amber-50 p-4 text-center">
            <p className="text-amber-600 text-sm">
              Need help? Contact our support team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccount;