import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaComment, FaMoneyBillWave, FaTruck, FaShoppingBag, FaSync } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

function YourOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState({ orderId: null, success: null });
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [instructions, setInstructions] = useState('');

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token available. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/your-orders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const result = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${result}`);
      }

      const result = await response.json();
      if (response.ok) {
        const updatedOrders = result.map(order => ({
          ...order,
          status: order.status || 'pending',
          paymentMethod: order.paymentMethod || 'upi', // Default to 'upi' if not set
          expectedDeliveryDate: order.orderDate ? new Date(order.orderDate).setDate(new Date(order.orderDate).getDate() + 3) : null,
        })).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        setOrders(updatedOrders);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch orders.');
      }
    } catch (err) {
      setError(`Error fetching orders: ${err.message}`);
      console.error('Orders error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'accepted') return order.status === 'accepted' || order.status === 'confirmed';
    return order.status === filter;
  });

  const handleUpiPayment = async (orderId, sellerName, totalPrice) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch(`http://localhost:5000/api/get-upi-id?sellerName=${encodeURIComponent(sellerName)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
      }

      const data = await response.json();
      const { upiId } = data;
      if (!upiId) {
        throw new Error('No UPI ID available for this seller');
      }

      setUpiId(upiId);
      const upiData = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${(totalPrice * 100).toFixed(0)}&tn=Payment%20for%20Order%20#${orderId}&cu=INR`;
      setInstructions(`Scan this QR code with your UPI app (e.g., PhonePe, Paytm) to pay ₹${totalPrice} for Order #${orderId}. Right-click to download.`);

      setSelectedOrder({ _id: orderId, totalPrice, sellerName });
      setShowPaymentConfirmation(true);
    } catch (err) {
      setError(`Error initiating payment: ${err.message}`);
      console.error('Payment error:', err);
    }
  };

  const handleAction = async (orderId, action) => {
    if (loadingAction) return;
    setLoadingAction(orderId);
    setNotificationStatus({ orderId, success: null });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token available.');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/order-action/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: action } : o));
      setNotificationStatus({ orderId, success: true });
      alert(result.message);
    } catch (err) {
      setError(`Error updating order: ${err.message}`);
      setNotificationStatus({ orderId, success: false });
      console.error('Action error:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePaymentConfirmation = async (orderId, confirmed) => {
    if (confirmed) {
      fetchOrders(); // Refresh orders to reflect any backend updates
      setError(null);
    }
    setShowPaymentConfirmation(false);
    setSelectedOrder(null);
    setUpiId('');
    setInstructions('');
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setChatOpen(false);
    setNotificationStatus({ orderId: null, success: null });
    setShowPaymentConfirmation(false);
    setUpiId('');
    setInstructions('');
  };

  const openChat = (order) => {
    setSelectedOrder(order);
    setChatOpen(true);
    fetchChatMessages(order._id);
  };

  const fetchChatMessages = async (orderId) => {
    setLoadingChat(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/chat-messages/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch chat messages');
      const messages = await response.json();
      setChatMessages(messages);
    } catch (err) {
      setError(`Error fetching chat messages: ${err.message}`);
    } finally {
      setLoadingChat(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoadingChat(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          sender: user.username,
          receiver: selectedOrder.buyerUsername !== user.username ? selectedOrder.buyerUsername : selectedOrder.sellerName,
          message,
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const newMessage = await response.json();
      setChatMessages([...chatMessages, newMessage]);
      setMessage('');
    } catch (err) {
      setError(`Error sending message: ${err.message}`);
    } finally {
      setLoadingChat(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
      case 'confirmed':
      case 'paid':
        return <FaCheck className="text-green-500 inline mr-1" />;
      case 'declined':
        return <FaTimes className="text-red-500 inline mr-1" />;
      case 'pending':
        return <FaShoppingBag className="text-amber-500 inline mr-1" />;
      case 'shipped':
        return <FaTruck className="text-blue-500 inline mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8 px-4 pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between">
          <h1 className="text-4xl md:text-5xl font-extrabold text-amber-900 text-center mb-4 md:mb-0">
            Your Orders
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
          >
            <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Orders'}
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full ${filter === 'all' ? 'bg-amber-500 text-white' : 'bg-white text-amber-700'} transition-all duration-300`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-full ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-white text-amber-700'} transition-all duration-300`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-full ${filter === 'accepted' ? 'bg-amber-500 text-white' : 'bg-white text-amber-700'} transition-all duration-300`}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilter('declined')}
            className={`px-4 py-2 rounded-full ${filter === 'declined' ? 'bg-amber-500 text-white' : 'bg-white text-amber-700'} transition-all duration-300`}
          >
            Declined
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            <p className="text-amber-700 mt-4">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center mb-6">
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <div className="text-amber-500 text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-semibold text-amber-900 mb-2">No orders found</h3>
            <p className="text-amber-700 mb-6">
              {filter === 'all'
                ? "You haven't placed any orders yet."
                : `You don't have any ${filter} orders.`}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300"
              >
                View All Orders
              </button>
            )}
            {filter === 'all' && (
              <Link
                to="/products"
                className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300"
              >
                Browse Products
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              console.log('Order data:', order, 'User type:', user.userType); // Enhanced debug log
              return (
                <div key={order._id} className="bg-white rounded-xl p-5 shadow-lg border border-amber-200 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-semibold text-amber-900">Order #{order.orderId || order._id.substring(0, 8)}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'accepted' || order.status === 'confirmed' || order.status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.status === 'declined' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {getStatusIcon(order.status)}
                      {order.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-amber-700 flex justify-between">
                      <span>Total:</span>
                      <span className="font-semibold">₹{order.totalPrice || order.total}</span>
                    </p>
                    <p className="text-amber-700">
                      {order.items && order.items.length > 0
                        ? `${order.items.length} item${order.items.length > 1 ? 's' : ''}`
                        : '1 item'}
                    </p>
                    <p className="text-amber-700 text-sm">
                      Ordered on: {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>

                  {user.userType === 'Consumer' && order.paymentMethod !== 'cod' && (
                    <button
                      onClick={() => handleUpiPayment(order._id, order.sellerName, order.totalPrice || order.total)}
                      className="w-full mb-3 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-colors duration-300 flex items-center justify-center"
                    >
                      <FaMoneyBillWave className="mr-2" /> Pay Now
                    </button>
                  )}
                  
                  {user.userType === 'Producer' && order.status === 'pending' && order.sellerName === user.username && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => handleAction(order._id, 'accepted')}
                        className={`bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors duration-300 flex items-center justify-center ${loadingAction === order._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loadingAction === order._id}
                      >
                        {loadingAction === order._id ? '...' : <><FaCheck className="mr-1" /> Accept</>}
                      </button>
                      <button
                        onClick={() => handleAction(order._id, 'declined')}
                        className={`bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-colors duration-300 flex items-center justify-center ${loadingAction === order._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loadingAction === order._id}
                      >
                        {loadingAction === order._id ? '...' : <><FaTimes className="mr-1" /> Decline</>}
                      </button>
                    </div>
                  )}
                  
                  {notificationStatus.orderId === order._id && (
                    <div className={`mt-2 text-sm ${notificationStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                      {notificationStatus.success ? 'Notification sent to buyer!' : 'Failed to send notification.'}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => openOrderDetails(order)}
                      className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-800 py-2 rounded-lg transition-colors duration-300"
                    >
                      Details
                    </button>
                    {(order.status === 'accepted' || order.status === 'confirmed' || order.status === 'paid') && (
                      <button
                        onClick={() => openChat(order)}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-2 rounded-lg transition-colors duration-300"
                        title="Chat"
                      >
                        <FaComment />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg border border-amber-200 shadow-2xl relative overflow-auto max-h-[90vh]">
            <button
              onClick={closeOrderDetails}
              className="absolute top-4 right-4 text-gray-500 hover:text-amber-700 transition-colors duration-300 text-xl"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-amber-900 mb-6 flex items-center">
              <FaShoppingBag className="mr-2 text-amber-600" /> Order Details
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-3">Order Summary</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-amber-50">
                      <th className="p-2 border text-left">Item</th>
                      <th className="p-2 border text-left">Qty</th>
                      <th className="p-2 border text-left">Price</th>
                      <th className="p-2 border text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.productId && (
                      <tr>
                        <td className="p-2 border">{selectedOrder.itemName || 'N/A'}</td>
                        <td className="p-2 border">{selectedOrder.quantity}</td>
                        <td className="p-2 border">₹{selectedOrder.price || (selectedOrder.totalPrice / selectedOrder.quantity).toFixed(2)}</td>
                        <td className="p-2 border">₹{(selectedOrder.totalPrice || selectedOrder.total).toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                <div className="mt-4 text-right">
                  <p className="text-lg font-bold text-amber-900">
                    Grand Total: ₹{(selectedOrder.totalPrice || selectedOrder.total).toFixed(2)}
                  </p>
                  <p className="text-sm text-amber-700">
                    Expected Delivery: {selectedOrder.expectedDeliveryDate ? new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString() : 'To be determined'}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-2">Delivery Information</h3>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-amber-800"><span className="font-medium">Name:</span> {selectedOrder.buyerUsername || user.username}</p>
                  <p className="text-amber-800"><span className="font-medium">Address:</span> {selectedOrder.deliveryAddress}</p>
                  <p className="text-amber-800"><span className="font-medium">Mobile:</span> {selectedOrder.mobileNo || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-medium text-amber-800 mr-2">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedOrder.status === 'accepted' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'paid' ? 'bg-green-100 text-green-800' :
                  selectedOrder.status === 'declined' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {getStatusIcon(selectedOrder.status)}
                  {selectedOrder.status || 'Pending'}
                </span>
              </div>
              
              {selectedOrder.status === 'declined' && user.userType === 'Consumer' && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-700">
                    Sorry, your order was declined. <Link to="/products" className="underline font-medium">Browse other products</Link>
                  </p>
                </div>
              )}
              
              {user.userType === 'Producer' && selectedOrder.status === 'pending' && selectedOrder.sellerName === user.username && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAction(selectedOrder._id, 'accepted')}
                    className={`bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors duration-300 flex items-center justify-center ${loadingAction === selectedOrder._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loadingAction === selectedOrder._id}
                  >
                    {loadingAction === selectedOrder._id ? 'Processing...' : <><FaCheck className="mr-1" /> Accept Order</>}
                  </button>
                  <button
                    onClick={() => handleAction(selectedOrder._id, 'declined')}
                    className={`bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-colors duration-300 flex items-center justify-center ${loadingAction === selectedOrder._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loadingAction === selectedOrder._id}
                  >
                    {loadingAction === selectedOrder._id ? 'Processing...' : <><FaTimes className="mr-1" /> Decline Order</>}
                  </button>
                </div>
              )}
              
              {notificationStatus.orderId === selectedOrder._id && (
                <div className={`mt-2 text-sm ${notificationStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                  {notificationStatus.success ? 'Notification sent to buyer!' : 'Failed to send notification. Please try again later.'}
                </div>
              )}

              {selectedOrder.status === 'accepted' && user.userType === 'Consumer' && selectedOrder.paymentMethod !== 'cod' && (
                <button
                  onClick={() => handleUpiPayment(selectedOrder._id, selectedOrder.sellerName, selectedOrder.totalPrice || selectedOrder.total)}
                  className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors duration-300 flex items-center justify-center"
                >
                  <FaMoneyBillWave className="mr-2" /> Pay Now
                </button>
              )}

              {(selectedOrder.status === 'accepted' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'paid') && (
                <button
                  onClick={() => openChat(selectedOrder)}
                  className="w-full mt-2 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition-colors duration-300 flex items-center justify-center"
                >
                  <FaComment className="mr-2" /> Open Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPaymentConfirmation && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-green-200 shadow-2xl relative overflow-auto max-h-[90vh]">
            <button
              onClick={() => setShowPaymentConfirmation(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-green-700 transition-colors duration-300 text-xl"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center">
              <FaMoneyBillWave className="mr-2 text-green-600" /> Payment Confirmation
            </h2>
            
            <div className="space-y-4 text-center">
              <p><strong>Order ID:</strong> {selectedOrder._id}</p>
              <p><strong>Amount to Pay:</strong> ₹{selectedOrder.totalPrice || selectedOrder.total}</p>
              <p><strong>Seller UPI ID:</strong> {upiId}</p>
              {upiId && (
                <>
                  <QRCodeSVG value={`upi://pay?pa=${encodeURIComponent(upiId)}&am=${(selectedOrder.totalPrice * 100).toFixed(0)}&tn=Payment%20for%20Order%20#${selectedOrder._id}&cu=INR`} size={200} style={{ margin: '0 auto' }} />
                  <p className="text-green-700">{instructions}</p>
                  <a
                    href={`data:image/png;base64,${new QRCode(`upi://pay?pa=${encodeURIComponent(upiId)}&am=${(selectedOrder.totalPrice * 100).toFixed(0)}&tn=Payment%20for%20Order%20#${selectedOrder._id}&cu=INR`).toDataURL().split(',')[1]}`}
                    download={`payment_qr_order_${selectedOrder._id}.png`}
                    className="mt-2 inline-block bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                  >
                    Download QR Code
                  </a>
                </>
              )}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => handlePaymentConfirmation(selectedOrder._id, true)}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg transition-colors duration-300"
                >
                  Confirm Payment
                </button>
                <button
                  onClick={() => setShowPaymentConfirmation(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-6 rounded-lg transition-colors duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {chatOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-5 w-full max-w-md border border-purple-200 shadow-2xl relative max-h-[80vh] flex flex-col">
            <button
              onClick={() => setChatOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-purple-700 transition-colors duration-300 text-xl"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
              <FaComment className="mr-2" /> Order Chat
            </h2>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
              {loadingChat ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                  <p className="text-purple-700 mt-2">Loading messages...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-8 text-purple-600 bg-purple-50 rounded-lg">
                  <FaComment className="text-4xl mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className={`p-3 rounded-lg max-w-xs ${msg.sender === user.username ? 'bg-amber-100 ml-auto' : 'bg-purple-100 mr-auto'}`}>
                    <p className="font-medium text-amber-900">{msg.sender}:</p>
                    <p className="text-amber-800">{msg.message}</p>
                    <p className="text-xs text-amber-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                disabled={loadingChat}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className={`bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-lg transition-colors duration-300 ${loadingChat ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loadingChat || !message.trim()}
              >
                {loadingChat ? '...' : 'Send'}
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mt-3">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default YourOrders;