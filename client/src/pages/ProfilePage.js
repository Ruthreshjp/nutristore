import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle, FaBoxOpen, FaMoneyBillWave, FaUsers, FaEdit, FaShoppingCart, FaCheckCircle, FaClock, FaShieldAlt } from 'react-icons/fa';
import axios from 'axios';

const ProfilePage = () => {
  const { userType, username, user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingVerification, setUpdatingVerification] = useState(false);

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      setError('No refresh token available. Please log in again.');
      return null;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/refresh-token', { token: refreshToken });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      if (setUser) setUser({ ...user, token: newToken });
      return newToken;
    } catch (err) {
      console.error('Refresh token error:', err.response?.data || err.message);
      setError('Failed to refresh token. Please log in again.');
      return null;
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setProfile(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateVerification = async () => {
    if (!profile.verified) {
      setUpdatingVerification(true);
      try {
        const res = await axios.put(
          'http://localhost:5000/api/profile',
          { verified: true },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setProfile((prev) => ({ ...prev, verified: true }));
      } catch (err) {
        if (err.response?.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            const retryRes = await axios.put(
              'http://localhost:5000/api/profile',
              { verified: true },
              { headers: { Authorization: `Bearer ${newToken}` } }
            );
            setProfile((prev) => ({ ...prev, verified: true }));
          } else {
            setError('Token refresh failed. Please log in again.');
          }
        } else {
          setError(`Failed to update verification status: ${err.response?.data?.message || err.message}`);
        }
      } finally {
        setUpdatingVerification(false);
      }
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchProfile();
    } else {
      setError('No authentication token found');
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.refreshProfile) {
      fetchProfile();
    }
  }, [location.state]);

  // No need to redirect here; handled by popup after login
  // Remove or comment out the profile completeness check if not needed post-login
  /*
  useEffect(() => {
    if (profile) {
      const isProfileComplete = profile.name && profile.mobile && profile.address && profile.occupation && profile.upiId &&
        (userType !== 'Producer' || (profile.bank?.accountNumber && profile.bank?.bankName && profile.bank?.branch &&
          profile.bank?.ifsc && profile.bank?.accountHolderName && profile.kisanCard && profile.farmerId));
      if (!isProfileComplete) {
        navigate('/edit-profile', { state: { incomplete: true } });
      } else if (isProfileComplete && !profile.verified) {
        updateVerification();
      }
    }
  }, [profile, userType, navigate]);
  */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-amber-700 text-xl animate-pulse">Loading your profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="text-red-500 text-center text-lg mb-4">{error || 'Error loading profile'}</div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              {profile.photo ? (
                <img
                  src={`http://localhost:5000${profile.photo}`}
                  alt="Profile"
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-amber-100 border-4 border-white flex items-center justify-center shadow-lg">
                  <FaUserCircle className="text-4xl md:text-5xl text-amber-600" />
                </div>
              )}
              <div className="ml-4 md:ml-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white">{profile.name}</h2>
                <p className="text-amber-100 font-medium">
                  {userType === 'Producer' ? 'Agricultural Producer' : 'Valued Customer'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/edit-profile', { state: { refreshProfile: true } })}
              className="flex items-center gap-2 bg-white text-amber-600 hover:bg-amber-50 px-4 py-2 md:px-5 md:py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
            >
              <FaEdit /> Edit Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
              <FaUserCircle className="mr-2 text-amber-600" /> Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">Mobile</p>
                <p className="text-amber-900 text-lg">{profile.mobile || 'Not provided'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">Email</p>
                <p className="text-amber-900 text-lg">{profile.email || 'Not provided'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">Address</p>
                <p className="text-amber-900">{profile.address || 'Not provided'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">Occupation</p>
                <p className="text-amber-900">{profile.occupation || 'Not provided'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">UPI ID</p>
                <p className="text-amber-900">{profile.upiId || 'Not provided'}</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl ${profile.verified ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center">
                {profile.verified ? (
                  <FaCheckCircle className="text-green-500 text-xl mr-2" />
                ) : (
                  <FaClock className="text-amber-500 text-xl mr-2" />
                )}
                <span className={`font-semibold ${profile.verified ? 'text-green-700' : 'text-amber-700'}`}>
                  Account Verification: {profile.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              {!profile.verified && (
                <p className="text-amber-600 mt-2 text-sm">
                  Your account is under review. This usually takes 24-48 hours.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
              <FaShieldAlt className="mr-2 text-amber-600" /> Account Status
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-xl border border-amber-200">
                <p className="text-amber-700 font-semibold">Member Since</p>
                <p className="text-amber-900">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-xl border border-amber-200">
                <p className="text-amber-700 font-semibold">User Type</p>
                <p className="text-amber-900 capitalize">{userType}</p>
              </div>
              
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-xl border border-amber-200">
                <p className="text-amber-700 font-semibold">Profile Completion</p>
                <div className="w-full bg-amber-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-amber-600 h-2.5 rounded-full" 
                    style={{ width: `${profile.verified ? 100 : 85}%` }}
                  ></div>
                </div>
                <p className="text-amber-900 text-sm mt-1">{profile.verified ? '100% Complete' : '85% Complete'}</p>
              </div>
            </div>
          </div>
        </div>

        {userType === 'Producer' && profile.bank && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
              <FaMoneyBillWave className="mr-2 text-amber-600" /> Bank Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">Account Number</p>
                <p className="text-amber-900">{profile.bank.accountNumber || 'Not provided'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">Bank Name</p>
                <p className="text-amber-900">{profile.bank.bankName || 'Not provided'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">Branch</p>
                <p className="text-amber-900">{profile.bank.branch || 'Not provided'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">IFSC Code</p>
                <p className="text-amber-900">{profile.bank.ifsc || 'Not provided'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">Account Holder</p>
                <p className="text-amber-900">{profile.bank.accountHolderName || 'Not provided'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">Kisan Card</p>
                <p className="text-amber-900">{profile.kisanCard || 'Not provided'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-amber-700 font-semibold">Farmer ID</p>
                <p className="text-amber-900">{profile.farmerId || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}

        {userType === 'Producer' && (
          <div className="mt-6">
            <h3 className="text-2xl font-bold text-amber-900 mb-6 text-center">Producer Dashboard</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 shadow-lg text-white text-center transform hover:scale-105 transition-transform duration-300">
                <FaBoxOpen className="mx-auto text-3xl mb-2" />
                <div className="text-lg font-semibold">Listed Items</div>
                <div className="text-2xl font-bold">{profile.listedItems || 0}</div>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 shadow-lg text-white text-center transform hover:scale-105 transition-transform duration-300">
                <FaMoneyBillWave className="mx-auto text-3xl mb-2" />
                <div className="text-lg font-semibold">Income</div>
                <div className="text-2xl font-bold">₹{profile.monthlyIncome || 0}</div>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 shadow-lg text-white text-center transform hover:scale-105 transition-transform duration-300">
                <FaUsers className="mx-auto text-3xl mb-2" />
                <div className="text-lg font-semibold">Buyers</div>
                <div className="text-2xl font-bold">{profile.buyersCount || 0}</div>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 shadow-lg text-white text-center transform hover:scale-105 transition-transform duration-300">
                <FaShoppingCart className="mx-auto text-3xl mb-2" />
                <div className="text-lg font-semibold">Quantity Sold</div>
                <div className="text-2xl font-bold">{profile.quantitySold || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;