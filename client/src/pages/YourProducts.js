import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function YourProducts() {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token'); // ✅ Fetch JWT token
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(sessionStorage.getItem('actionVerified') === 'true');
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState(''); // ✅ For success alerts

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);
  const [newImage, setNewImage] = useState(null); // ✅ For image update
  const [newVideo, setNewVideo] = useState(null); // ✅ For video update

  useEffect(() => {
    if (isVerified) fetchProducts();
  }, [isVerified]);

  // ✅ Send OTP
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

  // ✅ Verify OTP
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
        fetchProducts();
      } else {
        setError('Invalid OTP or expired.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
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
      setStatusMessage('✅ Product deleted successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  const handleEditClick = (product) => {
    setCurrentEdit(product);
    setEditModalOpen(true);
    setNewImage(null); // Reset image
    setNewVideo(null); // Reset video
  };

  // ✅ Submit updated product (with image and video)
  const handleEditSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('itemName', currentEdit.itemName);
      formData.append('price', currentEdit.price);
      formData.append('quantity', currentEdit.quantity);
      formData.append('location', currentEdit.location);
      formData.append('harvestCondition', currentEdit.harvestCondition);
      formData.append('deliveryTime', currentEdit.deliveryTime);
      formData.append('expiryDate', currentEdit.expiryDate);
      formData.append('offers', currentEdit.offers);
      if (newImage) formData.append('image', newImage); // ✅ Add new image if uploaded
      if (newVideo) formData.append('video', newVideo); // ✅ Add new video if uploaded

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

      setStatusMessage('✅ Changes saved successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      alert('Failed to update product.');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setCurrentEdit({ ...currentEdit, [name]: value });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-100 to-blue-50 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-blue-200">
        <h2 className="text-4xl font-extrabold text-green-400 mb-10 text-center animate-pulseTitle tracking-wide">
          Your Products
        </h2>

        {statusMessage && (
          <p className="text-green-600 text-center font-semibold mb-4">{statusMessage}</p>
        )}

        {!isVerified && (
          <div className="space-y-5 max-w-md mx-auto">
            {!otpSent && (
              <button
                onClick={sendOTP}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-blue-600"
              >
                Send Verification OTP
              </button>
            )}
            {otpSent && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300"
                    placeholder="Enter OTP"
                  />
                </div>
                <button
                  onClick={verifyOTP}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-blue-600"
                >
                  Verify OTP
                </button>
                <button
                  onClick={resendOTP}
                  className="w-full mt-3 text-blue-600 underline hover:text-blue-800 text-sm"
                >
                  Resend OTP
                </button>
              </>
            )}
            {message && <p className="text-green-600 text-center">{message}</p>}
            {error && <p className="text-red-600 text-center">{error}</p>}
          </div>
        )}

        {isVerified && (
          <div className="space-y-6 mt-8">
            {loading ? (
              <p className="text-center text-gray-600">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-600">You don’t have any products listed.</p>
            ) : (
              products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white shadow-md rounded-xl p-6 border border-gray-200 w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-green-600 mb-2">{product.itemName}</h3>
                    <p>
                      <strong>Price:</strong> ₹{product.price} ({product.unit})
                    </p>
                    <p>
                      <strong>Quantity:</strong> {product.quantity}
                    </p>
                    <p>
                      <strong>Location:</strong> {product.location}
                    </p>
                    <p>
                      <strong>Harvest:</strong> {product.harvestCondition}
                    </p>
                    <p>
                      <strong>Delivery:</strong> {product.deliveryTime} day(s)
                    </p>
                    <p>
                      <strong>Expiry:</strong> {product.expiryDate || 'N/A'}
                    </p>
                    {product.offers && (
                      <p>
                        <strong>Offers:</strong> {product.offers}
                      </p>
                    )}
                    {product.video && (
                      <p>
                        <strong>Video:</strong> Available ✅
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Listed on: {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 ml-4">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && currentEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-green-600 mb-4">Edit Product</h3>

            {[
              { label: 'Item Name', name: 'itemName' },
              { label: 'Price', name: 'price', type: 'number' },
              { label: 'Quantity', name: 'quantity', type: 'number' },
              { label: 'Location', name: 'location' },
              { label: 'Harvest Condition', name: 'harvestCondition' },
              { label: 'Delivery Time (days)', name: 'deliveryTime', type: 'number' },
              { label: 'Expiry Date', name: 'expiryDate', type: 'date' },
              { label: 'Offers', name: 'offers' },
            ].map(({ label, name, type = 'text' }) => (
              <div key={name} className="mb-3">
                <label className="block font-medium mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={currentEdit[name] || ''}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
            ))}

            {/* ✅ Image Upload */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Update Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewImage(e.target.files[0])}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>

            {/* ✅ Video Upload */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Update Video</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setNewVideo(e.target.files[0])}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>

            <div className="flex justify-end mt-4 gap-4">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleEditSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default YourProducts;
