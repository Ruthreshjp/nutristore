import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaEdit, FaTrash, FaEye, FaUpload, FaTimes, FaCheckCircle, FaSpinner } from 'react-icons/fa';

function YourProducts() {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Reset to false on load
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('success'); // 'success' or 'error'

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [newVideo, setNewVideo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Check if verification is needed on mount
    const storedVerified = sessionStorage.getItem('actionVerified') === 'true';
    if (!storedVerified) {
      sendOTP(); // Automatically trigger OTP on load if not verified
    } else {
      setIsVerified(true);
      fetchProducts();
    }
  }, []);

  // Send OTP
  const sendOTP = async () => {
    setMessage('');
    setError('');
    try {
      const res = await axios.post(
        'http://localhost:5000/api/send-action-otp',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.message) {
        setOtpSent(true);
        setMessage('OTP sent to your registered email.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (!otp) return setError('OTP is required.');
    setError('');
    try {
      const res = await axios.post(
        'http://localhost:5000/api/verify-action-otp',
        { otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.verified) {
        setIsVerified(true);
        sessionStorage.setItem('actionVerified', 'true');
        setOtpSent(false); // Reset OTP sent state after verification
        setOtp(''); // Clear OTP input
        fetchProducts();
      } else {
        setError(res.data.message || 'Invalid OTP or expired.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    }
  };

  const resendOTP = async () => {
    setOtp('');
    await sendOTP();
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/products/your', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch {
      setError('Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== id));
      setStatusMessage('Product deleted successfully');
      setStatusType('success');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setStatusMessage('Failed to delete product.');
      setStatusType('error');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleEditClick = (product) => {
    setCurrentEdit(product);
    setEditModalOpen(true);
    setNewImage(null);
    setNewVideo(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Submit updated product
  const handleEditSubmit = async () => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('itemName', currentEdit.itemName);
      formData.append('price', currentEdit.price);
      formData.append('quantity', currentEdit.quantity);
      formData.append('location', currentEdit.location);
      formData.append('harvestCondition', currentEdit.harvestCondition);
      formData.append('deliveryTime', currentEdit.deliveryTime);
      formData.append('expiryDate', currentEdit.expiryDate);
      formData.append('offers', currentEdit.offers || '');
      if (newImage) formData.append('image', newImage);
      if (newVideo) formData.append('video', newVideo);

      const res = await axios.put(
        `http://localhost:5000/api/products/${currentEdit._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const updated = products.map((p) => (p._id === res.data._id ? res.data : p));
      setProducts(updated);
      setEditModalOpen(false);

      setStatusMessage('Changes saved successfully');
      setStatusType('success');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      setStatusMessage('Failed to update product.');
      setStatusType('error');
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setCurrentEdit({ ...currentEdit, [name]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Status Message */}
        {statusMessage && (
          <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-xl shadow-lg animate-fadeIn ${
            statusType === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {statusMessage}
            <button
              onClick={() => setStatusMessage('')}
              className="ml-4 text-white hover:opacity-80"
            >
              ×
            </button>
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 md:p-8 border border-amber-200">
          <h2 className="text-3xl md:text-4xl font-extrabold text-amber-900 mb-2 text-center">
            Your Products
          </h2>
          <p className="text-amber-600 text-center mb-8">
            Manage your listed products
          </p>

          {!isVerified && (
            <div className="max-w-md mx-auto bg-amber-50 rounded-2xl p-6 shadow-lg border border-amber-200">
              <h3 className="text-xl font-semibold text-amber-900 mb-4 text-center">Verification Required</h3>
              {!otpSent ? (
                <button
                  onClick={sendOTP}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Send Verification OTP
                </button>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-amber-800 mb-2">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full p-3 rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      placeholder="Enter 6-digit OTP"
                    />
                  </div>
                  <button
                    onClick={verifyOTP}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg mb-3"
                  >
                    Verify OTP
                  </button>
                  <button
                    onClick={resendOTP}
                    className="w-full text-amber-600 hover:text-amber-800 text-sm transition-colors duration-300"
                  >
                    Resend OTP
                  </button>
                </>
              )}
              {message && <p className="text-green-600 text-center mt-3">{message}</p>}
              {error && <p className="text-red-600 text-center mt-3">{error}</p>}
            </div>
          )}

          {isVerified && (
            <div className="mt-8">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <FaSpinner className="animate-spin text-amber-500 text-4xl" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-amber-400 text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-amber-800 mb-2">No products listed yet</h3>
                  <p className="text-amber-600">You haven't added any products to your store.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-amber-100 overflow-hidden group"
                    >
                      <div className="relative">
                        <img
                          src={product.image ? `http://localhost:5000${product.image}` : '/api/placeholder/300/200'}
                          alt={product.itemName}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                          ₹{product.price}/{product.unit}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-amber-900 text-lg mb-2 truncate">{product.itemName}</h3>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-amber-700 mb-3">
                          <div className="flex items-center">
                            <span className="font-medium">Qty:</span>
                            <span className="ml-1">{product.quantity}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Location:</span>
                            <span className="ml-1 truncate">{product.location}</span>
                          </div>
                        </div>
                        
                        {product.offers && (
                          <div className="bg-amber-50 rounded-lg p-2 mb-3">
                            <p className="text-amber-700 text-sm font-medium">🎁 {product.offers}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-amber-500">
                            Listed {new Date(product.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditClick(product)}
                              className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors duration-300"
                              title="Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-300"
                              title="Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && currentEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-amber-200 p-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-amber-900">Edit Product</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-amber-600 hover:text-amber-800 rounded-full hover:bg-amber-100 transition-colors duration-300"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {[
                  { label: 'Item Name', name: 'itemName', type: 'text' },
                  { label: 'Price (₹)', name: 'price', type: 'number' },
                  { label: 'Quantity', name: 'quantity', type: 'number' },
                  { label: 'Location', name: 'location', type: 'text' },
                  { label: 'Harvest Condition', name: 'harvestCondition', type: 'text' },
                  { label: 'Delivery Time (days)', name: 'deliveryTime', type: 'number' },
                  { label: 'Expiry Date', name: 'expiryDate', type: 'date' },
                  { label: 'Special Offers', name: 'offers', type: 'text' },
                ].map(({ label, name, type }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-amber-800 mb-1">{label}</label>
                    <input
                      type={type}
                      name={name}
                      value={currentEdit[name] || ''}
                      onChange={handleEditChange}
                      className="w-full p-3 rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                ))}

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">Update Image</label>
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="p-3 border-2 border-dashed border-amber-300 rounded-xl text-center hover:bg-amber-50 transition-colors duration-300">
                        <FaUpload className="inline-block text-amber-500 mr-2" />
                        <span className="text-amber-700">Choose Image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                    )}
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">Update Video</label>
                  <label className="cursor-pointer">
                    <div className="p-3 border-2 border-dashed border-amber-300 rounded-xl text-center hover:bg-amber-50 transition-colors duration-300">
                      <FaUpload className="inline-block text-amber-500 mr-2" />
                      <span className="text-amber-700">Choose Video</span>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setNewVideo(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-amber-200">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-6 py-2 border border-amber-300 text-amber-700 rounded-xl hover:bg-amber-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={updating}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 flex items-center"
                >
                  {updating ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default YourProducts;