import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadRazorpay } from '../utils/razorpay';
import { Link } from 'react-router-dom';

function YourOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null); // Track loading state for actions
  const [chatOpen, setChatOpen] = useState(false); // State for chat modal
  const [message, setMessage] = useState(''); // Message input
  const [chatMessages, setChatMessages] = useState([]); // Store chat messages
  const [loadingChat, setLoadingChat] = useState(false); // Track chat loading

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token available. Please log in again.');
          return;
        }
        console.log('Fetching orders with token:', token.substring(0, 10) + '...');

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
            expectedDeliveryDate: order.orderDate ? new Date(order.orderDate).setDate(new Date(order.orderDate).getDate() + 3) : null,
          })).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)); // LIFO
          setOrders(updatedOrders);
          console.log('Fetched Orders:', updatedOrders); // Debug log for orders
        } else {
          setError(result.message || 'Failed to fetch orders.');
        }
      } catch (err) {
        setError(`Error fetching orders: ${err.message}`);
        console.error('Orders error:', err);
      }
    };
    fetchOrders();
  }, []);

  const handlePayment = async (orderId, amount) => {
    try {
      const razorpay = await loadRazorpay();
      if (!razorpay) {
        setError('Failed to load Razorpay SDK.');
        return;
      }
      const options = {
        key: process.env.RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY',
        amount: amount * 100,
        currency: 'INR',
        name: 'Nutri Store',
        description: `Payment for Order #${orderId}`,
        handler: async (response) => {
          const verifyResponse = await fetch('http://localhost:5000/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ orderId, paymentId: response.razorpay_payment_id }),
          });
          if (verifyResponse.ok) {
            alert('Payment verified! Awaiting producer approval.');
            setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'pending' } : o)); // Keep as pending
          } else {
            const result = await verifyResponse.json();
            setError(result.message || 'Payment verification failed.');
          }
        },
        prefill: { name: user?.name || 'Customer', email: user?.email || 'customer@example.com', contact: user?.mobileNumber || '9999999999' },
        theme: { color: '#3399cc' },
      };
      const rzp = new razorpay(options);
      rzp.open();
    } catch (err) {
      setError('Error initiating payment.');
      console.error('Payment error:', err);
    }
  };

  const handleAction = async (orderId, action) => {
    if (loadingAction) return; // Prevent multiple submissions
    setLoadingAction(orderId);

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
      console.log(`Order ${orderId} updated to ${action}`); // Debug log
      alert(result.message);
    } catch (err) {
      setError(`Error updating order: ${err.message}`);
      console.error('Action error:', err);
    } finally {
      setLoadingAction(null); // Reset loading state
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    console.log('Selected Order:', order); // Debug log
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setChatOpen(false); // Close chat when closing details
  };

  const openChat = (order) => {
    setSelectedOrder(order);
    setChatOpen(true);
    fetchChatMessages(order._id); // Fetch existing messages
    console.log('Opening chat for Order:', order._id, 'Status:', order.status); // Debug log
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
      console.log('Fetched Chat Messages:', messages); // Debug log
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
      setMessage(''); // Clear input
      console.log('Message sent:', newMessage); // Debug log
    } catch (err) {
      setError(`Error sending message: ${err.message}`);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-extrabold text-green-400 mb-12 text-center">Your Orders</h1>
        {error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-600">No orders yet.</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-green-700">Order #{order.orderId || order._id}</h2>
                <p>Status: <span className={
                  order.status === 'confirmed' || order.status === 'accepted' ? 'text-green-500' :
                  order.status === 'declined' ? 'text-red-500' :
                  'text-yellow-500'
                }>{order.status || 'Pending'}</span></p>
                <p>Total: ₹{order.totalPrice || order.total}</p>
                <p>Delivery Address: {order.deliveryAddress}</p>
                <p>Buyer Mobile: {order.mobileNo || 'Not provided'}</p>
                {order.paymentMethod !== 'cod' && order.status === 'pending' && user.userType === 'Consumer' && (
                  <button
                    onClick={() => handlePayment(order._id, order.totalPrice || order.total)}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Pay
                  </button>
                )}
                {user.userType === 'Producer' && order.status === 'pending' && order.sellerName === user.username && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleAction(order._id, 'accepted')}
                      className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${loadingAction === order._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={loadingAction === order._id}
                    >
                      {loadingAction === order._id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleAction(order._id, 'declined')}
                      className={`bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ${loadingAction === order._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={loadingAction === order._id}
                    >
                      {loadingAction === order._id ? 'Declining...' : 'Decline'}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => openOrderDetails(order)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  View Details
                </button>
                {(order.status === 'accepted' || order.status === 'confirmed') && (
                  <button
                    onClick={() => openChat(order)}
                    className="mt-4 ml-2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Chat
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg border border-green-200 shadow-2xl relative overflow-auto max-h-[90vh]">
            <button
              onClick={closeOrderDetails}
              className="absolute top-2 right-2 text-gray-700 hover:text-red-500 transition-colors duration-300"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">Order Details</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Bill</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border text-left">Item Name</th>
                    <th className="p-2 border text-left">Quantity</th>
                    <th className="p-2 border text-left">Price (₹)</th>
                    <th className="p-2 border text-left">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.productId && (
                    <tr>
                      <td className="p-2 border">{selectedOrder.itemName || 'N/A'}</td>
                      <td className="p-2 border">{selectedOrder.quantity}</td>
                      <td className="p-2 border">{selectedOrder.price || selectedOrder.totalPrice / selectedOrder.quantity}</td>
                      <td className="p-2 border">{(selectedOrder.totalPrice || selectedOrder.total).toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="text-right mt-4">
                <p className="text-lg font-bold">Grand Total: ₹{(selectedOrder.totalPrice || selectedOrder.total).toFixed(2)}</p>
                <p className="text-md text-gray-600">Expected Delivery Date: {selectedOrder.expectedDeliveryDate ? new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString() : 'TBD'}</p>
              </div>
              <p><strong>Buyer Name:</strong> {selectedOrder.buyerUsername || user.username}</p>
              <p><strong>Buyer Address:</strong> {selectedOrder.deliveryAddress}</p>
              <p><strong>Buyer Mobile Number:</strong> {selectedOrder.mobileNo || 'Not provided'}</p>
              <p><strong>Status:</strong> <span className={
                selectedOrder.status === 'confirmed' || selectedOrder.status === 'accepted' ? 'text-green-500' :
                selectedOrder.status === 'declined' ? 'text-red-500' :
                'text-yellow-500'
              }>{selectedOrder.status || 'Pending'}</span></p>
              {selectedOrder.status === 'declined' && user.userType === 'Consumer' && (
                <p className="text-red-700">Sorry, your order was declined. <Link to="/products" className="underline">Order another product</Link></p>
              )}
              {user.userType === 'Producer' && selectedOrder.status === 'pending' && selectedOrder.sellerName === user.username && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleAction(selectedOrder._id, 'accepted')}
                    className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${loadingAction === selectedOrder._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loadingAction === selectedOrder._id}
                  >
                    {loadingAction === selectedOrder._id ? 'Accepting...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleAction(selectedOrder._id, 'declined')}
                    className={`bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ${loadingAction === selectedOrder._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loadingAction === selectedOrder._id}
                  >
                    {loadingAction === selectedOrder._id ? 'Declining...' : 'Decline'}
                  </button>
                </div>
              )}
              {(selectedOrder.status === 'accepted' || selectedOrder.status === 'confirmed') && (
                <button
                  onClick={() => openChat(selectedOrder)}
                  className="mt-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                  Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-purple-200 shadow-2xl relative overflow-auto max-h-[80vh]">
            <button
              onClick={() => setChatOpen(false)}
              className="absolute top-2 right-2 text-gray-700 hover:text-red-500 transition-colors duration-300"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-purple-700 mb-4 text-center">Chat with {selectedOrder.buyerUsername !== user.username ? selectedOrder.buyerUsername : selectedOrder.sellerName}</h2>
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
              {loadingChat ? (
                <p className="text-center text-gray-500">Loading messages...</p>
              ) : chatMessages.length === 0 ? (
                <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className={`p-2 rounded-lg ${msg.sender === user.username ? 'bg-blue-100 text-right ml-auto' : 'bg-gray-100 text-left mr-auto'} max-w-xs`}>
                    <p><strong>{msg.sender}:</strong> {msg.message}</p>
                    <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</p>
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
                className="flex-1 p-2 border rounded"
                disabled={loadingChat}
              />
              <button
                onClick={sendMessage}
                className={`bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 ${loadingChat ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loadingChat || !message.trim()}
              >
                {loadingChat ? 'Sending...' : 'Send'}
              </button>
            </div>
            {error && <p className="text-red-500 text-center mt-2">{error}</p>}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default YourOrders;