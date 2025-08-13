import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaMoneyCheckAlt } from 'react-icons/fa';

function UpdateBankDetails() {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    accountNumber: '',
    bankName: '',
    branch: '',
    ifsc: '',
    accountHolderName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user?.token) {
      navigate('/login', { replace: true });
      return;
    }
    if (userType !== 'Producer') {
      setError('Only Producers can update bank details.');
      setIsFetching(false);
      return;
    }
    async function fetchProfile() {
      try {
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFormData({
          accountNumber: res.data.bank?.accountNumber || '',
          bankName: res.data.bank?.bankName || '',
          branch: res.data.bank?.branch || '',
          ifsc: res.data.bank?.ifsc || '',
          accountHolderName: res.data.bank?.accountHolderName || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bank details');
        console.error('Fetch bank details error:', err.response?.data || err.message);
      } finally {
        setIsFetching(false);
      }
    }
    fetchProfile();
  }, [user, userType, loading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountNumber || !formData.bankName || !formData.branch || !formData.ifsc || !formData.accountHolderName) {
      setError('All bank details are required.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await axios.put(
        'http://localhost:5000/api/update-bank-details',
        formData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      navigate('/profile', { state: { refreshProfile: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bank details');
      console.error('Update bank details error:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-10">
        <div className="bg-gradient-to-r from-indigo-600/80 to-cyan-400/80 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-500/30 p-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-lime-400 to-teal-300 bg-clip-text text-transparent text-center mb-8">
            Update Bank Details
          </h1>

          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          {isLoading && <p className="text-cyan-300 text-center mb-4">Updating...</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">Branch</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">IFSC Code</label>
              <input
                type="text"
                name="ifsc"
                value={formData.ifsc}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">Account Holder Name</label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
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
                {isLoading ? 'Updating...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
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

export default UpdateBankDetails;