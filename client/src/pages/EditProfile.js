import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUserEdit } from 'react-icons/fa';

function EditProfile() {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    occupation: '',
    kisanCard: '',
    farmerId: '',
    photo: null,
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
    async function fetchProfile() {
      try {
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFormData({
          name: res.data.name || '',
          address: res.data.address || '',
          occupation: res.data.occupation || '',
          kisanCard: res.data.kisanCard || '',
          farmerId: res.data.farmerId || '',
          photo: null,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile data');
        console.error('Fetch profile error:', err.response?.data || err.message);
      } finally {
        setIsFetching(false);
      }
    }
    fetchProfile();
  }, [user, loading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, JPG).');
      return;
    }
    setFormData((prev) => ({ ...prev, photo: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Name is required.');
      return;
    }
    if (userType === 'Producer' && (!formData.kisanCard || !formData.farmerId)) {
      setError('Kisan Card and Farmer ID are required for Producers.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('address', formData.address);
    data.append('occupation', formData.occupation);
    if (userType === 'Producer') {
      data.append('kisanCard', formData.kisanCard);
      data.append('farmerId', formData.farmerId);
    }
    if (formData.photo) {
      data.append('photo', formData.photo);
    }

    try {
      await axios.put('http://localhost:5000/api/profile', data, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/profile', { state: { refreshProfile: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error('Update profile error:', err.response?.data || err.message);
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
            Edit Profile
          </h1>

          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          {isLoading && <p className="text-cyan-300 text-center mb-4">Updating...</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
              />
            </div>
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">Occupation</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
              />
            </div>
            {userType === 'Producer' && (
              <>
                <div>
                  <label className="block text-cyan-300 mb-2 font-medium">Kisan Card</label>
                  <input
                    type="text"
                    name="kisanCard"
                    value={formData.kisanCard}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 mb-2 font-medium">Farmer ID</label>
                  <input
                    type="text"
                    name="farmerId"
                    value={formData.farmerId}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-cyan-300 mb-2 font-medium">Profile Photo</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-gray-200"
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

export default EditProfile;