import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [newNotificationCount, setNewNotificationCount] = useState(0);

  useEffect(() => {
    const checkNotifications = async () => {
      if (!user || !user.token) return;

      try {
        const response = await fetch('http://localhost:5000/api/notifications', {
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        // Check for unread notifications (either no status or status is 'pending', or read is false)
        const unreadNotifications = data.filter(n => !n.status || n.status === 'pending' || (n.read === false));
        const count = unreadNotifications.length;
        setNewNotificationCount(count);
        setHasNewNotifications(count > 0);
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  return (
    <NotificationContext.Provider value={{ hasNewNotifications, newNotificationCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = () => useContext(NotificationContext);