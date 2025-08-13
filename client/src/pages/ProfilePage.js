import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle, FaBoxOpen, FaMoneyBillWave, FaUsers, FaEdit, FaShoppingCart } from 'react-icons/fa';
import axios from 'axios';

const ProfilePage = () => {
  const { userType, username, user, setUser } = useAuth(); // Added setUser to update token
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingVerification, setUpdatingVerification] = useState(false);

  // Function to refresh token
  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken'); // Assume stored during login
    if (!refreshToken) {
      setError('No refresh token available. Please log in again.');
      return null;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/refresh-token', { token: refreshToken });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      if (setUser) setUser({ ...user, token: newToken }); // Update AuthContext if possible
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
      console.log('Sending verification update:', { verified: true });
      try {
        const res = await axios.put(
          'http://localhost:5000/api/profile',
          { verified: true },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setProfile((prev) => ({ ...prev, verified: true }));
        console.log('Verification updated successfully:', res.data);
      } catch (err) {
        console.error('Error updating verification:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          config: err.config,
        });
        if (err.response?.status === 401) { // Token expired
          const newToken = await refreshToken();
          if (newToken) {
            const retryRes = await axios.put(
              'http://localhost:5000/api/profile',
              { verified: true },
              { headers: { Authorization: `Bearer ${newToken}` } }
            );
            setProfile((prev) => ({ ...prev, verified: true }));
            console.log('Verification updated successfully after token refresh:', retryRes.data);
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

  useEffect(() => {
    if (profile) {
      console.log('Profile photo:', profile.photo);

      const isProfileComplete = profile.name && profile.mobile && profile.address && profile.occupation &&
        (userType !== 'Producer' || (profile.bank?.accountNumber && profile.bank?.bankName && profile.bank?.branch &&
          profile.bank?.ifsc && profile.bank?.accountHolderName && profile.kisanCard && profile.farmerId));

      if (isProfileComplete && !profile.verified) {
        updateVerification();
      }
    }
  }, [profile, userType]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-900 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-xl">{error || 'Error loading profile'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-10">
        <div className="bg-gradient-to-r from-indigo-600/80 to-cyan-400/80 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-500/30 p-8">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-cyan-500/50 pb-6">
            <div className="flex items-center gap-6">
              {profile.photo ? (
                <img
                  src={`http://localhost:5000${profile.photo}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-cyan-500/50"
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
              ) : (
                <FaUserCircle className="w-24 h-24 text-cyan-300" />
              )}
              <div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-lime-400 to-teal-300 bg-clip-text text-transparent">
                  {profile.name}
                </h2>
                <p className="text-cyan-300 font-semibold">
                  {userType === 'Producer' ? 'Producer' : 'Consumer'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/edit-profile', { state: { refreshProfile: true } })}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-300"
            >
              <FaEdit /> Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <strong className="text-cyan-300">Mobile:</strong>{' '}
              <span className="text-gray-900">{profile.mobile}</span>
            </div>
            <div>
              <strong className="text-cyan-300">Email:</strong>{' '}
              <span className="text-gray-900">{profile.email}</span>
            </div>
            <div>
              <strong className="text-cyan-300">Address:</strong>{' '}
              <span className="text-gray-900">{profile.address}</span>
            </div>
            <div>
              <strong className="text-cyan-300">Occupation:</strong>{' '}
              <span className="text-gray-900">{profile.occupation}</span>
            </div>
          </div>

          {userType === 'Producer' && (
            <>
              <div className="mt-10">
                <h3 className="text-2xl font-bold text-cyan-300 mb-4">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong className="text-cyan-300">Account Number:</strong>{' '}
                    <span className="text-gray-900">{profile.bank?.accountNumber}</span>
                  </div>
                  <div>
                    <strong className="text-cyan-300">Bank Name:</strong>{' '}
                    <span className="text-gray-900">{profile.bank?.bankName}</span>
                  </div>
                  <div>
                    <strong className="text-cyan-300">Branch:</strong>{' '}
                    <span className="text-gray-900">{profile.bank?.branch}</span>
                  </div>
                  <div>
                    <strong className="text-cyan-300">IFSC Code:</strong>{' '}
                    <span className="text-gray-900">{profile.bank?.ifsc}</span>
                  </div>
                  <div>
                    <strong className="text-cyan-300">Account Holder:</strong>{' '}
                    <span className="text-gray-900">{profile.bank?.accountHolderName}</span>
                  </div>
                  <div>
                    <strong className="text-cyan-300">Kisan Card:</strong>{' '}
                    <span className="text-gray-900">{profile.kisanCard}</span>
                  </div>
                  <div>
                    <strong className="text-cyan-300">Farmer ID:</strong>{' '}
                    <span className="text-gray-900">{profile.farmerId}</span>
                  </div>
                  <div>
                    <strong className="text-cyan-300">Verification:</strong>{' '}
                    <span className="text-green-400">{profile.verified ? '✅ Verified' : '⏳ Pending'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-2xl font-bold text-cyan-300 mb-6">Producer Dashboard</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-gray-800/80 rounded-lg p-6 shadow-lg border border-cyan-500/30 hover:scale-105 transition-transform duration-300">
                    <FaBoxOpen className="mx-auto text-3xl text-lime-400 mb-2" />
                    <div className="text-lg font-semibold text-lime-400 text-center">Listed Items</div>
                    <div className="text-2xl font-bold text-gray-900 text-center">{profile.listedItems || 0}</div>
                  </div>
                  <div className="bg-gray-800/80 rounded-lg p-6 shadow-lg border border-cyan-500/30 hover:scale-105 transition-transform duration-300">
                    <FaMoneyBillWave className="mx-auto text-3xl text-lime-400 mb-2" />
                    <div className="text-lg font-semibold text-lime-400 text-center">Monthly Income</div>
                    <div className="text-2xl font-bold text-gray-900 text-center">₹{profile.monthlyIncome || 0}</div>
                  </div>
                  <div className="bg-gray-800/80 rounded-lg p-6 shadow-lg border border-cyan-500/30 hover:scale-105 transition-transform duration-300">
                    <FaUsers className="mx-auto text-3xl text-lime-400 mb-2" />
                    <div className="text-lg font-semibold text-lime-400 text-center">Buyers</div>
                    <div className="text-2xl font-bold text-gray-900 text-center">{profile.buyersCount || 0}</div>
                  </div>
                  <div className="bg-gray-800/80 rounded-lg p-6 shadow-lg border border-cyan-500/30 hover:scale-105 transition-transform duration-300">
                    <FaShoppingCart className="mx-auto text-3xl text-lime-400 mb-2" />
                    <div className="text-lg font-semibold text-lime-400 text-center">Quantity Sold</div>
                    <div className="text-2xl font-bold text-gray-900 text-center">{profile.quantitySold || 0}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;