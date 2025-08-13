import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { token, userType, username }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Validate token with backend
        axios
          .get('http://localhost:5000/api/profile', {
            headers: { Authorization: `Bearer ${storedToken}` },
          })
          .then((response) => {
            setUser(userData); // Token is valid, set user
          })
          .catch((err) => {
            console.error('Token validation failed:', err.response?.data || err.message);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch (err) {
        console.error('Error parsing stored user data:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userType, username) => {
    const userData = { username, userType, token };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user, // { username, userType, token }
    login,
    logout,
    loading,
    token: user?.token || null,
    userType: user?.userType || null,
    username: user?.username || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);