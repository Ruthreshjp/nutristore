import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaMoneyCheckAlt, FaArrowLeft, FaSave } from 'react-icons/fa';

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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-amber-700 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error && userType !== 'Producer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-red-500 text-center text-lg mb-6">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 pt-20 pb-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-amber-100 p-4 rounded-full">
                <FaMoneyCheckAlt className="text-amber-600 text-3xl" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">Update Bank Details</h1>
            <p className="text-amber-100 mt-2">Secure payment information for your account</p>
          </div>

          {/* Form */}
          <div className="p-6 md:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-amber-900 font-medium mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter account holder name"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-amber-900 font-medium mb-2">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter account number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-medium mb-2">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter bank name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-medium mb-2">Branch</label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter branch name"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-amber-900 font-medium mb-2">IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc"
                    value={formData.ifsc}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter IFSC code"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaSave className="text-lg" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  disabled={isLoading}
                  className="flex-1 bg-amber-100 text-amber-700 py-4 rounded-xl font-semibold hover:bg-amber-200 transition-all duration-300 flex items-center justify-center gap-2 border border-amber-200"
                >
                  <FaArrowLeft />
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Security Note */}
          <div className="bg-amber-50 p-6 border-t border-amber-200">
            <div className="flex items-start gap-3">
              <div className="bg-amber-200 p-2 rounded-full mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-amber-700 text-sm">
                Your bank details are encrypted and stored securely. We never share your financial information with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateBankDetails;