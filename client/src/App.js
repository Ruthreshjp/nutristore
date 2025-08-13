import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import YourOrders from './pages/YourOrders';
import Sell from './pages/Sell';
import ResetPassword from './pages/ResetPassword';
import YourProducts from './pages/YourProducts';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import EditProfile from './pages/EditProfile';
import UpdateBankDetails from './pages/UpdateBankDetails';
import ChangePassword from './pages/ChangePassword';
import DeleteAccount from './pages/DeleteAccount';
import Notifications from './components/Notifications';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-100 to-blue-50">
              <Navbar />
              <main className="flex-grow pt-8 pb-8">
                <div className="min-h-full flex items-center justify-center">
                  <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                    <Route path="/products/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
                    <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                    <Route path="/your-orders" element={<ProtectedRoute><YourOrders /></ProtectedRoute>} />
                    <Route path="/sell" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
                    <Route path="/your-products" element={<ProtectedRoute><YourProducts /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                    <Route path="/update-bank-details" element={<ProtectedRoute><UpdateBankDetails /></ProtectedRoute>} />
                    <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                    <Route path="/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    <Route path="*" element={<h1 className="text-2xl text-gray-600">404 - Page Not Found</h1>} />
                  </Routes>
                </div>
              </main>
              <Footer />
            </div>
          </Router>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;