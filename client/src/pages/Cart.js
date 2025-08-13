import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart, useCartDispatch } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { loadRazorpay } from '../utils/razorpay'; // Assume this utility exists

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
  const buyNowProcessed = useRef(false); // Ref to track if Buy Now has been processed

  // Handle Buy Now state only on initial mount
  useEffect(() => {
    // Run only once on mount
    if (location.state?.buyNow && !buyNowProcessed.current) {
      const { product, quantity } = location.state.buyNow;
      // Add or update the product in the cart
      const existingItem = cart.find(item => item._id === product._id);
      if (!existingItem) {
        dispatch({ type: 'ADD_TO_CART', payload: { ...product, quantity } });
      } else if (existingItem.quantity !== quantity) {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId: product._id, quantity } });
      }
      setCheckoutModalOpen(true); // Open checkout modal immediately
      buyNowProcessed.current = true; // Mark as processed
      // Clear the state to avoid re-triggering on back navigation
      window.history.replaceState({}, document.title);
    }

    // Address and notification setup
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
  }, [user, cart.length, dispatch, location.state]); // Depend on cart.length instead of full cart to avoid re-triggering on quantity changes

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
      // Reset buyNowProcessed if cart becomes empty to allow new Buy Now actions
      if (cart.length === 1) {
        buyNowProcessed.current = false;
        setCheckoutModalOpen(false); // Ensure modal closes if last item is removed
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
      // Close checkout modal if open to prevent re-opening
      if (checkoutModalOpen) setCheckoutModalOpen(false);
    }
  }, [cart, dispatch, checkoutModalOpen]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openCheckoutModal = () => setCheckoutModalOpen(true);
  const closeCheckoutModal = () => {
    setCheckoutModalOpen(false);
    // Reset buyNowProcessed to allow new Buy Now actions after manual close
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
        setOrderId(result.orderId); // Use custom orderId
        if (paymentMethod !== 'cod') {
          setRazorpayOrderId(result.order_id); // Store Razorpay order ID
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
    const razorpay = await loadRazorpay();
    if (!razorpay) {
      setError('Failed to load Razorpay SDK.');
      return;
    }

    const options = {
      key: process.env.RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY',
      amount: amount,
      currency: 'INR',
      name: 'Nutri Store',
      description: `Payment for Order #${orderId}`,
      order_id: razorpayOrderId,
      handler: async (response) => {
        const verifyResponse = await fetch('http://localhost:5000/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify({ orderId, paymentId: response.razorpay_payment_id }),
        });
        if (verifyResponse.ok) {
          alert('Payment verified! Awaiting producer approval.');
          closeCheckoutModal();
          openBillModal(); // Show bill after payment
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
          // Clear cart after successful order
          cart.forEach(item => dispatch({ type: 'REMOVE_FROM_CART', payload: item._id }));
          window.location.href = '/your-orders';
        }
        // For non-COD, confirmation is handled after payment
      } else {
        setError(result.message || 'Failed to send order request.');
      }
    } catch (err) {
      setError('Error sending order request.');
      console.error('Confirm error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-extrabold text-green-400 mb-12 text-center animate-pulseTitle tracking-wide">
          Your Shopping Cart
        </h1>

        {showAddNotification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg animate-fadeIn">
            Item added to cart successfully!
          </div>
        )}

        {cart.length === 0 ? (
          <div className="text-center text-gray-600 text-xl">
            Your cart is empty.{' '}
            <Link to="/products" className="text-blue-600 hover:underline">
              Shop now
            </Link>.
          </div>
        ) : (
          <>
            <div className="flex flex-col space-y-4 max-h-[60vh] overflow-y-auto w-full">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between bg-white rounded-lg p-4 shadow-md hover:bg-gray-50 transition-colors border-l-4 border-green-500 w-full"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={`http://localhost:5000${item.image}`}
                      alt={item.itemName}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div>
                      <h2 className="text-lg font-semibold text-green-700">{item.itemName}</h2>
                      <p className="text-sm text-gray-600">Seller: {item.sellerName}</p>
                      <p className="text-sm text-gray-600">Price: ₹{item.price} / {item.unit}</p>
                      {item.offers && (
                        <p className="text-sm text-green-600 font-medium">Offer: {item.offers}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item._id, -1)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg text-lg"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="text-xl font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item._id, 1)}
                        className="bg-green-500 text-white px-3 py-2 rounded-lg text-lg"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-gray-800 font-semibold text-xl">
                      ₹{(getDiscountedPrice(item) * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleRemove(item._id)}
                      className="text-yellow-500 hover:text-yellow-700 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-center text-red-500 mt-4">{error}</p>}

            <div className="mt-10 sticky bottom-4 bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-blue-200 w-full">
              <button
                onClick={openModal}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full mb-4 hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105"
              >
                View Details
              </button>
              <h2 className="text-2xl font-bold text-green-700 text-center mb-2">Cart Summary</h2>
              <p className="text-xl text-center text-gray-700">Total: ₹{calculateTotal()}</p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={openCheckoutModal}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal for Item Details */}
      {isModalOpen && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900/80 rounded-xl p-6 w-full max-w-2xl border border-blue-500/30 shadow-2xl relative animate-bounceIn overflow-auto max-h-[80vh]">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-white hover:text-red-500 transition-colors duration-300"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-blue-400 mb-4 text-center">Cart Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-white border-collapse">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="p-2 border-b border-blue-500/30 text-left">Item Name</th>
                    <th className="p-2 border-b border-blue-500/30 text-left">Seller Name</th>
                    <th className="p-2 border-b border-blue-500/30 text-left">Location</th>
                    <th className="p-2 border-b border-blue-500/30 text-left">Quantity</th>
                    <th className="p-2 border-b border-blue-500/30 text-left">Price</th>
                    <th className="p-2 border-b border-blue-500/30 text-left">Offer</th>
                    <th className="p-2 border-b border-blue-500/30 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="p-2 border-b border-blue-500/30">{item.itemName}</td>
                      <td className="p-2 border-b border-blue-500/30">{item.sellerName}</td>
                      <td className="p-2 border-b border-blue-500/30">{item.location}</td>
                      <td className="p-2 border-b border-blue-500/30">{item.quantity}</td>
                      <td className="p-2 border-b border-blue-500/30">₹{item.price}</td>
                      <td className="p-2 border-b border-blue-500/30">{item.offers || '-'}</td>
                      <td className="p-2 border-b border-blue-500/30">₹{(getDiscountedPrice(item) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-lg font-bold text-green-400 mt-4 text-center">Grand Total: ₹{calculateTotal()}</p>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModalOpen && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg border border-green-200 shadow-2xl relative overflow-auto max-h-[90vh]">
            <button
              onClick={closeCheckoutModal}
              className="absolute top-2 right-2 text-gray-700 hover:text-red-500 transition-colors duration-300"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">Checkout</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700">Door No</label>
                <input
                  type="text"
                  value={deliveryAddress.doorNo}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, doorNo: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter door number"
                />
              </div>
              <div>
                <label className="block text-gray-700">Street</label>
                <input
                  type="text"
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter street"
                />
              </div>
              <div>
                <label className="block text-gray-700">City</label>
                <input
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-gray-700">Taluk</label>
                <input
                  type="text"
                  value={deliveryAddress.taluk}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, taluk: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter taluk"
                />
              </div>
              <div>
                <label className="block text-gray-700">District</label>
                <input
                  type="text"
                  value={deliveryAddress.district}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, district: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter district"
                />
              </div>
              <div>
                <label className="block text-gray-700">Pin Code</label>
                <input
                  type="text"
                  value={deliveryAddress.pin}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pin: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter pin code"
                />
              </div>
              <div>
                <label className="block text-gray-700">Mobile Number</label>
                <input
                  type="tel"
                  value={deliveryAddress.mobileNo}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, mobileNo: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <label className="block text-gray-700">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>
              <Link to="/products" className="block text-center text-blue-600 hover:underline">
                Add More Products
              </Link>
              <button
                onClick={handlePlaceOrder}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                disabled={!deliveryAddress.doorNo || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.taluk || !deliveryAddress.district || !deliveryAddress.pin || !deliveryAddress.mobileNo}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {billModalOpen && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg border border-green-200 shadow-2xl relative overflow-auto max-h-[90vh]">
            <button
              onClick={closeBillModal}
              className="absolute top-2 right-2 text-gray-700 hover:text-red-500 transition-colors duration-300"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">Order Bill</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Order Details</h3>
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
                  {cart.map((item) => (
                    <tr key={item._id}>
                      <td className="p-2 border">{item.itemName}</td>
                      <td className="p-2 border">{item.quantity}</td>
                      <td className="p-2 border">{getDiscountedPrice(item).toFixed(2)}</td>
                      <td className="p-2 border">{(getDiscountedPrice(item) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right mt-4">
                <p className="text-lg font-bold">Grand Total: ₹{calculateTotal()}</p>
                <p className="text-md text-gray-600">Expected Delivery Date: {getExpectedDeliveryDate()}</p>
                <p className="text-md text-gray-600">Status: {orderStatus || 'Pending'}</p>
              </div>
              {paymentMethod === 'cod' && (
                <button
                  onClick={handleConfirmOrder}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  disabled={!orderId}
                >
                  Confirm Order
                </button>
              )}
              {/* For non-COD, no confirm button; status updates after producer approval */}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cartBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .animate-cartBounce {
          animation: cartBounce 2.5s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes bounceIn {
          0% { transform: scale(0.7); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounceIn {
          animation: bounceIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Cart;