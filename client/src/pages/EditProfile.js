import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUserEdit, FaArrowLeft, FaUpload, FaCheckCircle } from 'react-icons/fa';

function EditProfile() {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    occupation: '',
    kisanCard: '',
    farmerId: '',
    upiId: '',
    photo: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [success, setSuccess] = useState(false);

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
          upiId: res.data.upiId || '',
          photo: null,
        });
        if (res.data.photo) {
          setPreviewUrl(`http://localhost:5000${res.data.photo}`);
        }
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
    if (!file) return;
    
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, JPG).');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    
    setFormData((prev) => ({ ...prev, photo: file }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Name is required.');
      return;
    }
    if (!formData.upiId) {
      setError('UPI ID is required.');
      return;
    }
    if (userType === 'Producer' && (!formData.kisanCard || !formData.farmerId)) {
      setError('Kisan Card and Farmer ID are required for Producers.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('address', formData.address);
    data.append('occupation', formData.occupation);
    data.append('upiId', formData.upiId);
    if (userType === 'Producer') {
      data.append('kisanCard', formData.kisanCard);
      data.append('farmerId', formData.farmerId);
    }
    if (formData.photo) {
      data.append('photo', formData.photo);
    }

    try {
      const res = await axios.put('http://localhost:5000/api/profile', data, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Profile update response:', res.data); // Debug log
      setSuccess(true);
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-amber-700 font-medium">Loading your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 pt-20 pb-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center text-amber-700 hover:text-amber-900 transition-colors duration-200 mr-4"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-900 flex items-center">
            <FaUserEdit className="mr-3 text-amber-600" />
            Edit Profile
          </h1>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center animate-fadeIn">
            <FaCheckCircle className="mr-2 text-green-500" />
            Profile updated successfully!
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-200">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 border-4 border-white/30 overflow-hidden mx-auto mb-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-amber-300/50 flex items-center justify-center">
                    <FaUserEdit className="text-amber-700 text-3xl" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200">
                <FaUpload className="text-amber-600" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-amber-100 text-sm mt-2">Click camera icon to upload photo</p>
          </div>

          <div className="p-6 md:p-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-amber-900 font-medium mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-medium mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your occupation"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-900 font-medium mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Your complete address"
                />
              </div>

              <div>
                <label className="block text-amber-900 font-medium mb-2">
                  UPI ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your UPI ID (e.g., user@bank)"
                  required
                />
              </div>

              {userType === 'Producer' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-amber-900 font-medium mb-2">
                        Kisan Card Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="kisanCard"
                        value={formData.kisanCard}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                        placeholder="Kisan card number"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-amber-900 font-medium mb-2">
                        Farmer ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="farmerId"
                        value={formData.farmerId}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                        placeholder="Farmer identification number"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  disabled={isLoading}
                  className="flex-1 bg-amber-100 text-amber-700 py-4 px-6 rounded-xl font-semibold hover:bg-amber-200 transition-all duration-300 border border-amber-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-amber-100 border border-amber-200 rounded-2xl p-6 mt-6">
          <h3 className="text-amber-900 font-semibold mb-2 flex items-center">
            <FaCheckCircle className="text-amber-600 mr-2" />
            Profile Information
          </h3>
          <p className="text-amber-700 text-sm">
            Keep your profile updated to ensure the best experience on NutriStore. 
            {userType === 'Producer' && ' Verified producer accounts get priority in search results.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;