import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart, useCartDispatch } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FaTrash, FaPlus, FaMinus, FaShoppingBag, FaReceipt, FaCheckCircle } from 'react-icons/fa';

function Cart() {
  const { cart } = useCart();
  const dispatch = useCartDispatch();
  const { user } = useAuth();
  const { notifications, addNotification } = useNotifications();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    doorNo: '',
    street: '',
    city: '',
    taluk: '',
    district: '',
    pin: '',
    mobileNo: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [showAddNotification, setShowAddNotification] = useState(false);
  const buyNowProcessed = useRef(false);

  useEffect(() => {
    if (location.state?.buyNow && !buyNowProcessed.current) {
      const { product, quantity } = location.state.buyNow;
      const existingItem = cart.find(item => item._id === product._id);
      if (!existingItem) {
        dispatch({ type: 'ADD_TO_CART', payload: { ...product, quantity } });
      } else if (existingItem.quantity !== quantity) {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId: product._id, quantity } });
      }
      setCheckoutModalOpen(true);
      buyNowProcessed.current = true;
      window.history.replaceState({}, document.title);
    }

    if (user?.address) {
      const [doorNo, ...rest] = user.address.split(', ');
      const [street, city, taluk, district, pin] = rest.join(', ').split(', ').slice(0, 5);
      const mobileNo = user.mobileNumber || '';
      setDeliveryAddress({ doorNo, street, city, taluk, district, pin, mobileNo });
    }

    if (cart.length > 0 && !buyNowProcessed.current) {
      setShowAddNotification(true);
      const timer = setTimeout(() => setShowAddNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, cart.length, dispatch, location.state]);

  const getDiscountedPrice = (item) => {
    if (item.offers && item.offers.includes('%')) {
      const match = item.offers.match(/(\d+)%/);
      return match ? item.price - (item.price * parseFloat(match[1])) / 100 : item.price;
    }
    return item.price;
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + getDiscountedPrice(item) * item.quantity, 0).toFixed(2);
  };

  const getExpectedDeliveryDate = () => {
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() + 3);
    return orderDate.toLocaleDateString();
  };

  const handleRemove = (itemId) => {
    try {
      dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
      setError(null);
      if (cart.length === 1) {
        buyNowProcessed.current = false;
        setCheckoutModalOpen(false);
      }
    } catch (err) {
      setError('Failed to remove item from cart.');
      console.error('Removal error:', err);
    }
  };

  const handleQuantityChange = useCallback((itemId, delta) => {
    const item = cart.find((i) => i._id === itemId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);
      dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity: newQuantity } });
      if (checkoutModalOpen) setCheckoutModalOpen(false);
    }
  }, [cart, dispatch, checkoutModalOpen]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openCheckoutModal = () => setCheckoutModalOpen(true);
  const closeCheckoutModal = () => {
    setCheckoutModalOpen(false);
    if (location.state?.buyNow) buyNowProcessed.current = false;
  };
  const openBillModal = () => setBillModalOpen(true);
  const closeBillModal = () => setBillModalOpen(false);

  const handlePlaceOrder = async () => {
    const { doorNo, street, city, taluk, district, pin, mobileNo } = deliveryAddress;
    if (!doorNo || !street || !city || !taluk || !district || !pin || !mobileNo) {
      setError('Please fill in all address fields and mobile number.');
      return;
    }

    const fullAddress = `${doorNo}, ${street}, ${city}, ${taluk}, ${district} - ${pin}`;
    const orderData = {
      cart: cart.map(item => ({
        _id: item._id,
        itemName: item.itemName,
        quantity: item.quantity,
        price: getDiscountedPrice(item),
      })),
      deliveryAddress: fullAddress,
      mobileNo,
      paymentMethod,
      total: calculateTotal(),
      buyerName: user?.username || 'Anonymous',
    };

    try {
      const response = await fetch('http://localhost:5000/api/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      if (response.ok) {
        setOrderId(result.orderId);
        if (paymentMethod !== 'cod') {
          setRazorpayOrderId(result.order_id);
          await handleRazorpayPayment(result.order_id, parseFloat(calculateTotal()) * 100);
        } else {
          closeCheckoutModal();
          openBillModal();
        }
      } else {
        setError(result.message || 'Failed to place order.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Order error:', err);
    }
  };

  const handleRazorpayPayment = async (razorpayOrderId, amount) => {
    // Razorpay integration logic here
  };

  const handleConfirmOrder = async () => {
    if (!orderId) return;

    try {
      const response = await fetch(`http://localhost:5000/api/confirm-order/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        if (paymentMethod === 'cod') {
          alert('Your order request has been sent to the producer.');
          cart.forEach(item => dispatch({ type: 'REMOVE_FROM_CART', payload: item._id }));
          window.location.href = '/your-orders';
        }
      } else {
        setError(result.message || 'Failed to send order request.');
      }
    } catch (err) {
      setError('Error sending order request.');
      console.error('Confirm error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-10 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-amber-900 mb-8 text-center animate-pulseTitle">
          <FaShoppingBag className="inline mr-3 text-amber-600" />
          Your Shopping Cart
        </h1>

        {showAddNotification && (
          <div className="fixed top-20 right-4 bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fadeIn z-50">
            <FaCheckCircle className="inline mr-2" />
            Item added to cart successfully!
          </div>
        )}

        {cart.length === 0 ? (
          <div className="text-center text-amber-700 text-xl bg-white/80 p-8 rounded-2xl shadow-lg">
            <FaShoppingBag className="text-4xl mx-auto mb-4 text-amber-500" />
            <p className="mb-4">Your cart is empty.</p>
            <Link 
              to="/products" 
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-amber-500"
                  >
                    <div className="flex items-center space-x-4 mb-4 md:mb-0 w-full md:w-auto">
                      <img
                        src={`http://localhost:5000${item.image}`}
                        alt={item.itemName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-amber-900">{item.itemName}</h2>
                        <p className="text-sm text-amber-700">Seller: {item.sellerName}</p>
                        <p className="text-sm text-amber-700">Price: ₹{item.price} / {item.unit}</p>
                        {item.offers && (
                          <p className="text-sm text-amber-600 font-medium">Offer: {item.offers}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full md:w-auto">
                      <div className="flex items-center gap-2 bg-amber-100 rounded-full p-1">
                        <button
                          onClick={() => handleQuantityChange(item._id, -1)}
                          className="bg-amber-500 text-white p-2 rounded-full text-sm hover:bg-amber-600 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <FaMinus />
                        </button>
                        <span className="text-lg font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item._id, 1)}
                          className="bg-amber-500 text-white p-2 rounded-full text-sm hover:bg-amber-600 transition-colors"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      
                      <p className="text-amber-900 font-semibold text-lg mx-4">
                        ₹{(getDiscountedPrice(item) * item.quantity).toFixed(2)}
                      </p>
                      
                      <button
                        onClick={() => handleRemove(item._id)}
                        className="text-red-500 hover:text-red-700 p-2 transition-colors"
                        title="Remove item"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-200 h-fit sticky top-24">
                <h2 className="text-2xl font-bold text-amber-900 mb-4 text-center">
                  <FaReceipt className="inline mr-2 text-amber-600" />
                  Order Summary
                </h2>
                
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item._id} className="flex justify-between text-amber-800">
                      <span className="truncate">{item.itemName} × {item.quantity}</span>
                      <span>₹{(getDiscountedPrice(item) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-amber-200 pt-4 mb-6">
                  <div className="flex justify-between text-lg font-semibold text-amber-900">
                    <span>Total:</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={openModal}
                    className="w-full bg-amber-100 text-amber-800 px-4 py-3 rounded-xl font-semibold hover:bg-amber-200 transition-colors"
                  >
                    View Detailed Summary
                  </button>
                  
                  <button
                    onClick={openCheckoutModal}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Item Details Modal */}
      {isModalOpen && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-auto border border-amber-300 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-amber-700 hover:text-amber-900 transition-colors"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">Cart Details</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-100">
                    <th className="p-3 border border-amber-200 text-left text-amber-900">Item Name</th>
                    <th className="p-3 border border-amber-200 text-left text-amber-900">Seller</th>
                    <th className="p-3 border border-amber-200 text-left text-amber-900">Location</th>
                    <th className="p-3 border border-amber-200 text-left text-amber-900">Quantity</th>
                    <th className="p-3 border border-amber-200 text-left text-amber-900">Price</th>
                    <th className="p-3 border border-amber-200 text-left text-amber-900">Offer</th>
                    <th className="p-3 border border-amber-200 text-left text-amber-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item._id} className="hover:bg-amber-50 transition-colors">
                      <td className="p-3 border border-amber-200">{item.itemName}</td>
                      <td className="p-3 border border-amber-200">{item.sellerName}</td>
                      <td className="p-3 border border-amber-200">{item.location}</td>
                      <td className="p-3 border border-amber-200 text-center">{item.quantity}</td>
                      <td className="p-3 border border-amber-200">₹{item.price}</td>
                      <td className="p-3 border border-amber-200">{item.offers || '-'}</td>
                      <td className="p-3 border border-amber-200 font-semibold">₹{(getDiscountedPrice(item) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-amber-100 rounded-xl text-center">
              <p className="text-xl font-bold text-amber-900">Grand Total: ₹{calculateTotal()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModalOpen && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-amber-300 shadow-2xl relative max-h-[90vh] overflow-auto">
            <button
              onClick={closeCheckoutModal}
              className="absolute top-4 right-4 text-amber-700 hover:text-amber-900 transition-colors"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">Checkout</h2>
            
            {error && (
              <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-amber-800 border-b border-amber-200 pb-2">Delivery Address</h3>
              
              {['doorNo', 'street', 'city', 'taluk', 'district', 'pin', 'mobileNo'].map((field) => (
                <div key={field}>
                  <label className="block text-amber-700 mb-1 capitalize">
                    {field === 'mobileNo' ? 'Mobile Number' : field.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type={field === 'mobileNo' ? 'tel' : 'text'}
                    value={deliveryAddress[field]}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, [field]: e.target.value })}
                    className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                  />
                </div>
              ))}
              
              <div>
                <label className="block text-amber-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>
              
              <div className="pt-4 border-t border-amber-200">
                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                  disabled={!deliveryAddress.doorNo || !deliveryAddress.street || !deliveryAddress.city || 
                           !deliveryAddress.taluk || !deliveryAddress.district || !deliveryAddress.pin || 
                           !deliveryAddress.mobileNo}
                >
                  Place Order
                </button>
                
                <Link 
                  to="/products" 
                  className="block text-center text-amber-600 hover:text-amber-800 mt-3"
                >
                  Add More Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {billModalOpen && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-amber-300 shadow-2xl relative max-h-[90vh] overflow-auto">
            <button
              onClick={closeBillModal}
              className="absolute top-4 right-4 text-amber-700 hover:text-amber-900 transition-colors"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">Order Bill</h2>
            
            {error && (
              <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-amber-800">Order Details</h3>
              
              <div className="bg-amber-50 rounded-xl p-4">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between mb-2">
                    <span className="text-amber-800">{item.itemName} × {item.quantity}</span>
                    <span className="font-semibold">₹{(getDiscountedPrice(item) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <div className="border-t border-amber-200 pt-2 mt-3">
                  <div className="flex justify-between font-bold text-lg text-amber-900">
                    <span>Grand Total:</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-amber-700">
                <p>Expected Delivery: {getExpectedDeliveryDate()}</p>
                <p>Status: {orderStatus || 'Pending'}</p>
              </div>
              
              {paymentMethod === 'cod' && (
                <button
                  onClick={handleConfirmOrder}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                  disabled={!orderId}
                >
                  Confirm Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;