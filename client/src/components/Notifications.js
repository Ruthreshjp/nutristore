import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token available. Please log in again.');
          return;
        }
        console.log('Fetching notifications with token:', token.substring(0, 10) + '...');

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
      alert(result.message);
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
        method: 'DELETE', // Assuming DELETE endpoint for deletion
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
      alert('Notification deleted successfully.');
    } catch (err) {
      setError(`Error deleting notification: ${err.message}`);
      console.error('Delete error:', err);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const hasNewNotifications = notifications.some(n => !n.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-extrabold text-green-400 mb-12 text-center">Notifications</h1>
        {error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-600">No notifications yet.</p>
        ) : (
          <div className="space-y-6">
            {notifications.map((notification) => (
              <div key={notification._id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 relative">
                <button
                  onClick={() => handleDelete(notification._id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
                <h2 className="text-xl font-semibold text-green-700">Order #{notification.orderId}</h2>
                <p>Buyer: {notification.buyerUsername}</p>
                <p>Address: {notification.deliveryAddress}</p>
                <p>Status: {notification.status || 'Pending'}</p>
                {!notification.status && (
                  <p className="mt-2 text-blue-600">
                    New Order! <Link to="/your-orders" className="underline">Go to Orders Page</Link>
                  </p>
                )}
                {user.userType === 'Producer' && !notification.status && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleAction(notification._id, 'accepted')}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(notification._id, 'declined')}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Decline
                    </button>
                  </div>
                )}
                {notification.status === 'accepted' && (
                  <p className="mt-4 text-green-700">Processed! <Link to="/your-orders" className="underline">Order Page</Link></p>
                )}
                {notification.status === 'declined' && (
                  <p className="mt-4 text-red-700">Declined. <Link to="/products" className="underline">Order another product</Link></p>
                )}
              </div>
            ))}
          </div>
        )}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p>Type "confirm" to delete this notification:</p>
              <input
                type="text"
                onChange={(e) => {
                  if (e.target.value === 'confirm') confirmDeleteNotification();
                }}
                className="border p-2 mt-2 w-full"
                placeholder="Type 'confirm'"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={cancelDelete} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .notification-dot {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 10px;
          height: 10px;
          background-color: red;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}

export default Notifications;