// Sell.js
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Sell() {
  const { token, setUser } = useAuth(); // Added setUser to update token if needed

  const [formData, setFormData] = useState({
    itemName: '',
    price: '',
    unit: 'per kg',
    quantity: '',
    location: '',
    image: null,
    video: null,
    harvestCondition: 'harvested',
    deliveryTime: '1',
    expiryDate: '',
    offers: '',
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'image') {
      const file = files?.[0] || null;
      setFormData((prev) => ({ ...prev, image: file }));
      setPreviewUrl(file ? URL.createObjectURL(file) : null);
    } else if (name === 'video') {
      const file = files?.[0] || null;
      setFormData((prev) => ({ ...prev, video: file }));
      setVideoPreview(file ? URL.createObjectURL(file) : null);
    } else if (name === 'quantity') {
      const numValue = Math.max(1, parseInt(value) || 1);
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      setMessage('No refresh token available. Please log in again.');
      return null;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/refresh-token', { token: refreshToken });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      if (setUser) setUser({ ...token, token: newToken }); // Update AuthContext if possible
      return newToken;
    } catch (err) {
      console.error('Refresh token error:', err.response?.data || err.message);
      setMessage('Failed to refresh token. Please log in again.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        if (key === 'offers' && formData[key]) {
          form.append(key, `${formData[key]}% off`);
        } else {
          form.append(key, formData[key]);
        }
      }
    });

    try {
      const response = await axios.post('http://localhost:5000/api/submit-product', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage(response.data.message || 'Product listed successfully!');
      setFormData({
        itemName: '',
        price: '',
        unit: 'per kg',
        quantity: '',
        location: '',
        image: null,
        video: null,
        harvestCondition: 'harvested',
        deliveryTime: '1',
        expiryDate: '',
        offers: '',
      });
      setPreviewUrl(null);
      setVideoPreview(null);
    } catch (err) {
      console.error('Sell submission error:', err);
      if (err.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          const retryResponse = await axios.post('http://localhost:5000/api/submit-product', form, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${newToken}`,
            },
          });
          setMessage(retryResponse.data.message || 'Product listed successfully after token refresh!');
        }
      } else {
        setMessage('Error: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-blue-200">
        <h2 className="text-4xl font-extrabold text-green-400 mb-12 text-center animate-pulseTitle tracking-wide">Sell Your Product</h2>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300"
              placeholder="E.g. Organic Tomatoes"
            />
          </div>

          {/* Price and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg border border-gray-300"
                placeholder="E.g. 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-300"
              >
                <option value="per kg">per kg</option>
                <option value="per litre">per litre</option>
                <option value="per piece">per piece</option>
                <option value="per pack">per pack</option>
              </select>
            </div>
          </div>

          {/* Quantity and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg border border-gray-300"
                min="1"
                placeholder="E.g. 10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg border border-gray-300"
                placeholder="E.g. Chennai"
              />
            </div>
          </div>

          {/* Harvest Condition and Delivery Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Condition</label>
              <select
                name="harvestCondition"
                value={formData.harvestCondition}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-300"
              >
                <option value="harvested">Harvested</option>
                <option value="not harvested">Not Harvested</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time (Days)</label>
              <select
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-300"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiry Date and Offers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offers (% off)</label>
              <input
                type="number"
                name="offers"
                value={formData.offers}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-300"
                placeholder="E.g. 10"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition"
            />
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
                <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-lg border" />
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Video (Optional)</label>
            <input
              type="file"
              name="video"
              accept="video/*"
              onChange={handleChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
            />
            {videoPreview && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Video Preview:</p>
                <video src={videoPreview} controls className="w-full max-h-64 rounded-lg border"></video>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-blue-600 transition transform hover:scale-105"
          >
            {isLoading ? 'Submitting...' : 'Submit Product'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-green-700 font-medium animate-fadeIn">{message}</p>
        )}
      </div>
    </div>
  );
}

export default Sell;