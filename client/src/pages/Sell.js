import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaUpload, FaImage, FaVideo, FaLeaf, FaTruck, FaCalendarAlt, FaTag, FaMapMarkerAlt, FaWeightHanging, FaRupeeSign } from 'react-icons/fa';

function Sell() {
  const { token, setUser } = useAuth();

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
      if (setUser) setUser({ ...token, token: newToken });
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-2xl border border-amber-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-amber-900 mb-2">
            Sell Your <span className="text-amber-600">Product</span>
          </h2>
          <p className="text-amber-700">List your fresh produce and reach customers directly</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Item Name */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center">
              <FaLeaf className="mr-2 text-amber-600" /> Item Name
            </label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
              placeholder="E.g. Organic Tomatoes"
            />
          </div>

          {/* Price and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center">
                <FaRupeeSign className="mr-2 text-amber-600" /> Price (₹)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                placeholder="E.g. 100"
              />
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center">
                <FaWeightHanging className="mr-2 text-amber-600" /> Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
              >
                <option value="per kg">per kg</option>
                <option value="per litre">per litre</option>
                <option value="per piece">per piece</option>
                <option value="per pack">per pack</option>
              </select>
            </div>
          </div>

          {/* Quantity and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <label className="block text-sm font-medium text-amber-800 mb-2">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                min="1"
                placeholder="E.g. 10"
              />
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-amber-600" /> Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                placeholder="E.g. Chennai"
              />
            </div>
          </div>

          {/* Harvest Condition and Delivery Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center">
                <FaLeaf className="mr-2 text-amber-600" /> Harvest Condition
              </label>
              <select
                name="harvestCondition"
                value={formData.harvestCondition}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
              >
                <option value="harvested">Harvested</option>
                <option value="not harvested">Not Harvested</option>
              </select>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center">
                <FaTruck className="mr-2 text-amber-600" /> Delivery Time (Days)
              </label>
              <select
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <option key={day} value={day}>{day} day{day > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiry Date and Offers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center">
                <FaCalendarAlt className="mr-2 text-amber-600" /> Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center">
                <FaTag className="mr-2 text-amber-600" /> Offers (% off)
              </label>
              <input
                type="number"
                name="offers"
                value={formData.offers}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                placeholder="E.g. 10"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center">
              <FaImage className="mr-2 text-amber-600" /> Product Image
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-amber-300 border-dashed rounded-xl cursor-pointer bg-amber-25 hover:bg-amber-100 transition-all duration-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaUpload className="w-8 h-8 mb-3 text-amber-500" />
                  <p className="mb-2 text-sm text-amber-700"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-amber-600">PNG, JPG, JPEG (Max. 5MB)</p>
                </div>
                <input 
                  type="file" 
                  name="image" 
                  accept="image/*" 
                  onChange={handleChange} 
                  required 
                  className="hidden" 
                />
              </label>
            </div>
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm text-amber-700 mb-2">Image Preview:</p>
                <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-xl border border-amber-200 shadow-sm" />
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center">
              <FaVideo className="mr-2 text-amber-600" /> Product Video (Optional)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-amber-300 border-dashed rounded-xl cursor-pointer bg-amber-25 hover:bg-amber-100 transition-all duration-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaUpload className="w-8 h-8 mb-3 text-amber-500" />
                  <p className="mb-2 text-sm text-amber-700"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-amber-600">MP4, MOV (Max. 20MB)</p>
                </div>
                <input 
                  type="file" 
                  name="video" 
                  accept="video/*" 
                  onChange={handleChange} 
                  className="hidden" 
                />
              </label>
            </div>
            {videoPreview && (
              <div className="mt-4">
                <p className="text-sm text-amber-700 mb-2">Video Preview:</p>
                <video src={videoPreview} controls className="w-full max-h-64 rounded-xl border border-amber-200 shadow-sm"></video>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'List Product Now'
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center font-medium animate-fadeIn ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sell;