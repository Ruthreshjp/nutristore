import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle, FaEdit, FaCamera, FaSave } from 'react-icons/fa';
import axios from 'axios';

const EditProfile = () => {
  const { userType, username, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    occupation: '',
    kisanCard: '',
    farmerId: '',
    upiId: '',
    photo: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

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
      const { name, mobile, email, address, occupation, kisanCard, farmerId, upiId, photo } = res.data;
      setProfile({ name, mobile, email, address, occupation, kisanCard, farmerId, upiId, photo });
    } catch (err) {
      console.error('Error fetching profile:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', profile.name);
    formData.append('mobile', profile.mobile);
    formData.append('email', profile.email);
    formData.append('address', profile.address);
    formData.append('occupation', profile.occupation);
    if (userType === 'Producer') {
      formData.append('kisanCard', profile.kisanCard);
      formData.append('farmerId', profile.farmerId);
    }
    formData.append('upiId', profile.upiId);
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      const res = await axios.put('http://localhost:5000/api/profile', formData, {
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' },
      });
      console.log('Server response:', res.data); // Debug log
      navigate('/profile', { state: { refreshProfile: true } });
    } catch (err) {
      console.error('Update error:', err.response?.data || err.message); // Debug log
      if (err.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          const retryRes = await axios.put(
            'http://localhost:5000/api/profile',
            formData,
            { headers: { Authorization: `Bearer ${newToken}`, 'Content-Type': 'multipart/form-data' } }
          );
          console.log('Retry response:', retryRes.data); // Debug log
          navigate('/profile', { state: { refreshProfile: true } });
        } else {
          setError('Token refresh failed. Please log in again.');
        }
      } else {
        setError(`Failed to update profile: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handlePhotoChange = (e) => {
    setPhotoFile(e.target.files[0]);
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
    if (location.state?.incomplete) {
      setError('Please complete your profile details.');
    }
  }, [location.state]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-amber-700 text-xl animate-pulse">Loading your profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="text-red-500 text-center text-lg mb-4">{error}</div>
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
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold text-amber-900 text-center mb-8">Edit Profile</h2>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              {profile.photo ? (
                <img
                  src={profile.photo.startsWith('/Uploads') ? `http://localhost:5000${profile.photo}` : profile.photo}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-amber-100 border-4 border-white flex items-center justify-center shadow-lg">
                  <FaUserCircle className="text-4xl text-amber-600" />
                </div>
              )}
              <label className="mt-4 flex items-center gap-2 cursor-pointer text-amber-600 hover:text-amber-700">
                <FaCamera /> Change Photo
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>
            <div>
              <label className="block text-amber-700 font-semibold mb-2">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-amber-700 font-semibold mb-2">Mobile</label>
              <input
                type="text"
                value={profile.mobile}
                onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-amber-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-amber-700 font-semibold mb-2">Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-amber-700 font-semibold mb-2">Occupation</label>
              <input
                type="text"
                value={profile.occupation}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {userType === 'Producer' && (
              <>
                <div>
                  <label className="block text-amber-700 font-semibold mb-2">Kisan Card</label>
                  <input
                    type="text"
                    value={profile.kisanCard}
                    onChange={(e) => setProfile({ ...profile, kisanCard: e.target.value })}
                    className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-amber-700 font-semibold mb-2">Farmer ID</label>
                  <input
                    type="text"
                    value={profile.farmerId}
                    onChange={(e) => setProfile({ ...profile, farmerId: e.target.value })}
                    className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-amber-700 font-semibold mb-2">UPI ID</label>
              <input
                type="text"
                value={profile.upiId}
                onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition duration-300"
            >
              <FaSave /> Save Changes
            </button>
          </form>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default EditProfile;