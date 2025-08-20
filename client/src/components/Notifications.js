import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaBell, FaCheckCircle, FaTimesCircle, FaTrash, FaShoppingCart, FaBox, FaExclamationTriangle } from 'react-icons/fa';

function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token available. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        // Reverse the notifications array to show latest first
        setNotifications(result.reverse());
      } catch (err) {
        setError(`Error fetching notifications: ${err.message}`);
        console.error('Notifications error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleAction = async (notificationId, action) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token available.');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/notification-action/${notificationId}`, {
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
      setNotifications(notifications.map(n => n._id === notificationId ? { ...n, status: action } : n));
    } catch (err) {
      setError(`Error updating notification: ${err.message}`);
      console.error('Action error:', err);
    }
  };

  const handleDelete = (notificationId) => {
    setConfirmDelete(notificationId);
  };

  const confirmDeleteNotification = async () => {
    if (!confirmDelete) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token available.');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/notification-action/${confirmDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      setNotifications(notifications.filter(n => n._id !== confirmDelete));
      setConfirmDelete(null);
    } catch (err) {
      setError(`Error deleting notification: ${err.message}`);
      console.error('Delete error:', err);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token available.');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      // Update local state to mark all as read
      setNotifications(notifications.map(n => ({ ...n, status: n.status || 'read' })));
    } catch (err) {
      setError(`Error marking notifications as read: ${err.message}`);
      console.error('Mark all as read error:', err);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.status;
    if (filter === 'read') return notification.status;
    return true; // 'all'
  });

  const hasNewNotifications = notifications.some(n => !n.status);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <FaCheckCircle className="text-green-500 text-lg" />;
      case 'declined':
        return <FaTimesCircle className="text-red-500 text-lg" />;
      default:
        return <FaBell className="text-amber-500 text-lg" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'read':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-xl shadow-lg mr-4">
              <FaBell className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-900">Notifications</h1>
            {hasNewNotifications && (
              <span className="ml-3 flex h-5 w-5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500"></span>
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="bg-white rounded-lg p-1 shadow-inner">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-amber-50'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${filter === 'unread' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-amber-50'}`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${filter === 'read' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-amber-50'}`}
              >
                Read
              </button>
            </div>
            
            {hasNewNotifications && (
              <button
                onClick={markAllAsRead}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <FaExclamationTriangle className="mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredNotifications.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <div className="bg-amber-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
              <FaBell className="text-amber-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-amber-900 mb-2">No notifications yet</h3>
            <p className="text-amber-700 mb-4">
              {filter !== 'all' 
                ? `You don't have any ${filter} notifications.` 
                : "We'll notify you when something important happens."}
            </p>
            <Link
              to="/products"
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium px-6 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* Notifications List */}
        {!loading && filteredNotifications.length > 0 && (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`bg-white rounded-2xl p-5 shadow-lg border-l-4 transition-all duration-300 hover:shadow-xl ${
                  !notification.status 
                    ? 'border-amber-500 ring-2 ring-amber-500/20' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg mr-4 ${getStatusColor(notification.status)}`}>
                      {getStatusIcon(notification.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-amber-900 mb-1">
                        Order #{notification.orderId}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        <span className="font-medium">Buyer:</span> {notification.buyerUsername}
                      </p>
                      <p className="text-gray-600 mb-2">
                        <span className="font-medium">Address:</span> {notification.deliveryAddress}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                          {notification.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Delete notification"
                  >
                    <FaTrash />
                  </button>
                </div>

                {/* Action Buttons */}
                {!notification.status && user.userType === 'Producer' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAction(notification._id, 'accepted')}
                      className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      <FaCheckCircle className="mr-2" /> Accept Order
                    </button>
                    <button
                      onClick={() => handleAction(notification._id, 'declined')}
                      className="flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      <FaTimesCircle className="mr-2" /> Decline
                    </button>
                  </div>
                )}

                {/* Status Links */}
                {notification.status === 'accepted' && (
                  <div className="mt-4">
                    <Link 
                      to="/your-orders" 
                      className="inline-flex items-center text-green-600 hover:text-green-800 font-medium transition-colors"
                    >
                      <FaBox className="mr-2" /> View Order Details
                    </Link>
                  </div>
                )}
                
                {notification.status === 'declined' && (
                  <div className="mt-4">
                    <Link 
                      to="/products" 
                      className="inline-flex items-center text-amber-600 hover:text-amber-800 font-medium transition-colors"
                    >
                      <FaShoppingCart className="mr-2" /> Browse Other Products
                    </Link>
                  </div>
                )}
                
                {!notification.status && user.userType !== 'Producer' && (
                  <div className="mt-4">
                    <Link 
                      to="/your-orders" 
                      className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      <FaBox className="mr-2" /> Track Your Order
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
              <h2 className="text-xl font-bold text-amber-900 mb-4">Confirm Delete</h2>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this notification? This action cannot be undone.</p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button 
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteNotification}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;