const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const razorpay = require('razorpay');
require('dotenv').config();

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
const PORT = process.env.PORT || 5000;

// Initialize Razorpay with error handling
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret',
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Multer configuration for image + video
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'Uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const allowedVideoTypes = ['video/mp4', 'video/mkv', 'video/webm', 'video/avi'];

  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter }).fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/nutri-store')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobileNumber: { type: String, required: true, unique: true },
  userType: { type: String, enum: ['Producer', 'Consumer'], required: true },
  otp: String,
  otpExpires: Date,
  name: { type: String, required: true },
  photo: String,
  address: String,
  occupation: String,
  kisanCard: { type: String, required: function() { return this.userType === 'Producer'; } },
  farmerId: { type: String, required: function() { return this.userType === 'Producer'; } },
  bank: {
    accountNumber: { type: String, required: function() { return this.userType === 'Producer'; } },
    bankName: { type: String, required: function() { return this.userType === 'Producer'; } },
    branch: { type: String, required: function() { return this.userType === 'Producer'; } },
    ifsc: { type: String, required: function() { return this.userType === 'Producer'; } },
    accountHolderName: { type: String, required: function() { return this.userType === 'Producer'; } },
  },
  listedItems: { type: Number, default: 0 },
  monthlyIncome: { type: Number, default: 0 },
  buyersCount: { type: Number, default: 0 },
  quantitySold: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  notifications: { type: Boolean, default: true },
  language: { type: String, default: 'en' },
  refreshToken: { type: String },
});

const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  sellerName: { type: String, required: true },
  itemName: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  image: String,
  video: String,
  unit: { type: String, enum: ['per kg', 'per piece', 'per litre', 'per pack'], required: true },
  quantity: { type: Number, required: true },
  harvestCondition: { type: String, enum: ['harvested', 'not harvested'], required: true },
  deliveryTime: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  offers: String,
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Order Schema with custom orderId
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  buyerUsername: { type: String, required: true },
  sellerName: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending' },
  orderDate: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
  username: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
});

const Cart = mongoose.model('Cart', cartSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  buyerUsername: { type: String, required: true },
  sellerName: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model('Notification', notificationSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// Email transporter with retry logic
let transporterReady = false;
const maxRetries = 3;
let retryCount = 0;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const verifyTransporter = () => {
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter setup error:', error);
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying transporter setup (${retryCount}/${maxRetries})...`);
        setTimeout(verifyTransporter, 5000);
      } else {
        console.error('Max retries reached for email transporter setup');
      }
    } else {
      transporterReady = true;
      console.log('✅ Email transporter is ready');
    }
  });
};

verifyTransporter();

const sendEmailNotification = async (toEmail, buyerName, deliveryAddress, orderId) => {
  if (!transporterReady) {
    console.warn('Email transporter not ready, skipping notification');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Nutri Store" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'New Order Notification',
      text: `You have a new order from ${buyerName} on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Address: ${deliveryAddress}. Please accept or decline via the app. Order ID: ${orderId}`,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('JWT error:', err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Signup
app.post('/api/signup', async (req, res) => {
  const { username, email, password, mobileNumber, userType, name, address, occupation, kisanCard, farmerId, bank } = req.body;
  try {
    const validTypes = ['Producer', 'Consumer'];
    if (!validTypes.includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    const exists = await User.findOne({ $or: [{ username }, { email }, { mobileNumber }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hash,
      mobileNumber,
      userType,
      name,
      address,
      occupation,
      kisanCard: userType === 'Producer' ? kisanCard : undefined,
      farmerId: userType === 'Producer' ? farmerId : undefined,
      bank: userType === 'Producer' ? {
        accountNumber: bank?.accountNumber,
        bankName: bank?.bankName,
        branch: bank?.branch,
        ifsc: bank?.ifsc,
        accountHolderName: bank?.accountHolderName,
      } : undefined,
      verified: userType === 'Producer' ? false : true,
    });
    await newUser.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Signup error', error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password, userType } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'User not found' });

    if (user.userType !== userType) {
      return res.status(403).json({ message: `User type mismatch. Expected ${user.userType}` });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    const accessToken = jwt.sign(
      { sellerName: user.username, userType: user.userType },
      SECRET_KEY,
      { expiresIn: '8h' }
    );
    const refreshToken = jwt.sign(
      { sellerName: user.username, userType: user.userType },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      userType: user.userType,
      username: user.username,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

// Refresh Token
app.post('/api/refresh-token', async (req, res) => {
  const { token: refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

    jwt.verify(refreshToken, SECRET_KEY, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid refresh token' });

      const accessToken = jwt.sign(
        { sellerName: user.username, userType: user.userType },
        SECRET_KEY,
        { expiresIn: '8h' }
      );
      res.json({ token: accessToken });
    });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    res.status(500).json({ message: 'Error refreshing token', error: err.message });
  }
});

// OTP for login
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: `"Nutri Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'OTP Login',
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp, userType } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (user.userType !== userType) {
      return res.status(403).json({ message: `User type mismatch. Expected ${user.userType}` });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { sellerName: user.username, userType: user.userType },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'OTP login successful',
      token,
      userType: user.userType,
      username: user.username,
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
});

// Action OTP
app.post('/api/send-action-otp', authenticateToken, async (req, res) => {
  try {
    const sellerName = req.user.sellerName;
    const user = await User.findOne({ username: sellerName });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: `"Nutri Store" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Nutri Store Action Verification OTP',
      text: `Your OTP for action verification is ${otp}. It expires in 5 minutes.`,
    });

    res.json({ message: 'OTP sent successfully to your registered email.' });
  } catch (err) {
    console.error('Send action OTP error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

// Get Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.sellerName }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    let dashboardMetrics = {};
    if (user.userType === 'Producer') {
      const listedItems = await Product.countDocuments({ sellerName: user.username });
      const orders = await Order.find({ sellerName: user.username });
      const monthlyIncome = orders
        .filter(order => order.orderDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
        .reduce((sum, order) => sum + order.totalPrice, 0);
      const buyersCount = [...new Set(orders.map(order => order.buyerUsername))].length;
      const quantitySold = orders.reduce((sum, order) => sum + order.quantity, 0);

      dashboardMetrics = { listedItems, monthlyIncome, buyersCount, quantitySold };
      await User.updateOne({ username: user.username }, { $set: dashboardMetrics });
    }

    res.json({
      ...user,
      ...dashboardMetrics,
    });
  } catch (err) {
    console.error('Fetch profile error:', err.message);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

// Update Profile
app.put('/api/profile', authenticateToken, upload, async (req, res) => {
  try {
    const { name, address, occupation, kisanCard, farmerId } = req.body;
    const photo = req.files?.photo ? `/Uploads/${req.files.photo[0].filename}` : undefined;

    const updateData = { name, address, occupation };
    if (req.user.userType === 'Producer') {
      updateData.kisanCard = kisanCard;
      updateData.farmerId = farmerId;
    }
    if (photo) updateData.photo = photo;

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const user = await User.findOneAndUpdate(
      { username: req.user.sellerName },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
});

// Update Bank Details (Producer only)
app.put('/api/update-bank-details', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'Producer') {
      return res.status(403).json({ message: 'Only Producers can update bank details' });
    }

    const { accountNumber, bankName, branch, ifsc, accountHolderName } = req.body;
    if (!accountNumber || !bankName || !branch || !ifsc || !accountHolderName) {
      return res.status(400).json({ message: 'All bank details are required' });
    }

    const user = await User.findOneAndUpdate(
      { username: req.user.sellerName },
      {
        $set: {
          bank: { accountNumber, bankName, branch, ifsc, accountHolderName },
          verified: false,
        },
      },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Bank details updated successfully' });
  } catch (err) {
    console.error('Update bank details error:', err.message);
    res.status(500).json({ message: 'Error updating bank details', error: err.message });
  }
});

// Change Password
app.put('/api/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const user = await User.findOne({ username: req.user.sellerName });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
});

// Delete Account
app.delete('/api/delete-account', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.sellerName });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Promise.all([
      Product.deleteMany({ sellerName: user.username }),
      Cart.deleteMany({ username: user.username }),
      Order.deleteMany({ $or: [{ sellerName: user.username }, { buyerUsername: user.username }] }),
      user.deleteOne(),
    ]);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ message: 'Error deleting account', error: err.message });
  }
});

// Get Settings
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.sellerName }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      notifications: user.notifications,
      language: user.language,
    });
  } catch (err) {
    console.error('Fetch settings error:', err.message);
    res.status(500).json({ message: 'Error fetching settings', error: err.message });
  }
});

// Update Settings
app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { notifications, language } = req.body;
    const updateData = {};
    if (notifications !== undefined) updateData.notifications = notifications;
    if (language !== undefined) updateData.language = language;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No settings provided to update' });
    }

    const user = await User.findOneAndUpdate(
      { username: req.user.sellerName },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Settings updated successfully', notifications: user.notifications, language: user.language });
  } catch (err) {
    console.error('Update settings error:', err.message);
    res.status(500).json({ message: 'Error updating settings', error: err.message });
  }
});

// Submit Product
app.post('/api/submit-product', authenticateToken, upload, async (req, res) => {
  try {
    if (req.user.userType !== 'Producer') {
      return res.status(403).json({ message: 'Only Producers can submit products' });
    }

    const { itemName, price, location, unit, quantity, harvestCondition, deliveryTime, expiryDate, offers } = req.body;
    const image = req.files?.image ? `/Uploads/${req.files.image[0].filename}` : undefined;
    const video = req.files?.video ? `/Uploads/${req.files.video[0].filename}` : undefined;

    if (!itemName || !price || !location || !unit || !quantity || !harvestCondition || !deliveryTime || !expiryDate) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate and parse numeric fields
    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity);
    const parsedDeliveryTime = parseInt(deliveryTime);
    if (isNaN(parsedPrice) || isNaN(parsedQuantity) || isNaN(parsedDeliveryTime)) {
      return res.status(400).json({ message: 'Invalid numeric values for price, quantity, or delivery time' });
    }

    const newProduct = new Product({
      sellerName: req.user.sellerName,
      itemName,
      price: parsedPrice,
      location,
      image,
      video,
      unit,
      quantity: parsedQuantity,
      harvestCondition,
      deliveryTime: parsedDeliveryTime,
      expiryDate: new Date(expiryDate),
      offers,
    });

    const savedProduct = await newProduct.save();
    console.log('Product saved successfully:', savedProduct); // Debug log

    await User.findOneAndUpdate(
      { username: req.user.sellerName },
      { $inc: { listedItems: 1 } },
      { new: true }
    );

    res.status(201).json({ message: 'Product submitted successfully', product: savedProduct });
  } catch (err) {
    console.error('Submit product error:', err.message, { stack: err.stack, body: req.body });
    res.status(500).json({ message: 'Error submitting product', error: err.message });
  }
});

// Fetch Products
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({ sellerName: req.user.sellerName }).lean();
    console.log('Fetched products for user:', req.user.sellerName, products); // Debug log
    res.json(products);
  } catch (err) {
    console.error('Fetch products error:', err.message);
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
});

// Fetch Specific Product
app.get('/api/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    console.log('Fetched specific product:', product); // Debug log
    res.json(product);
  } catch (err) {
    console.error('Fetch product error:', err.message);
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
});

// Add to Cart
app.post('/api/add-to-cart/:productId', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const cartItem = await Cart.findOne({ username: req.user.sellerName, product: productId });
    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      const newCartItem = new Cart({
        username: req.user.sellerName,
        product: productId,
        quantity,
      });
      await newCartItem.save();
    }

    res.status(200).json({}); // Empty response to indicate success
  } catch (err) {
    console.error('Add to cart error:', err.message);
    res.status(500).json({ message: 'Error adding to cart', error: err.message });
  }
});

// Place Order
app.post('/api/place-order', authenticateToken, async (req, res) => {
  const { cart, deliveryAddress, paymentMethod, total } = req.body;

  console.log('Place order request:', { cart, deliveryAddress, paymentMethod, total });

  try {
    if (!deliveryAddress || !paymentMethod || !cart || cart.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const orderId = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const orders = [];

    for (const item of cart) {
      if (!mongoose.Types.ObjectId.isValid(item._id)) {
        return res.status(400).json({ message: `Invalid product ID format for item ${item._id}` });
      }

      const product = await Product.findById(item._id);
      if (!product) {
        console.error(`Product not found for ID: ${item._id}`);
        return res.status(400).json({ message: `Product not found for ID: ${item._id}` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.itemName}` });
      }

      const itemTotalPrice = item.quantity * item.price;
      const order = new Order({
        orderId,
        buyerUsername: req.user.sellerName,
        sellerName: product.sellerName,
        productId: item._id,
        quantity: item.quantity,
        totalPrice: itemTotalPrice,
        deliveryAddress,
        paymentMethod,
        orderDate: new Date(),
      });
      await order.save();
      orders.push(order);

      const notification = new Notification({
        orderId: order._id,
        buyerUsername: req.user.sellerName,
        sellerName: product.sellerName,
        deliveryAddress,
      });
      await notification.save();

      const producer = await User.findOne({ username: product.sellerName });
      if (producer && producer.email && producer.notifications) {
        sendEmailNotification(producer.email, req.user.sellerName, deliveryAddress, order._id)
          .catch(err => console.error('Email notification failed:', err.message));
      }
    }

    const calculatedTotal = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    if (Math.abs(calculatedTotal - parseFloat(total)) > 0.01) {
      return res.status(400).json({ message: 'Total amount mismatch' });
    }

    if (paymentMethod === 'cod') {
      res.json({ message: 'Order placed successfully', orderId, status: 'pending', redirect: '/your-orders' });
    } else {
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: calculatedTotal * 100,
        currency: 'INR',
        receipt: `order_rcptid_${orderId}`,
        notes: {
          buyerUsername: req.user.sellerName,
          orderIds: orders.map(o => o._id),
        },
      });
      res.json({ message: 'Order created', order_id: razorpayOrder.id, amount: calculatedTotal });
    }
  } catch (err) {
    console.error('Place order error:', err.message, { stack: err.stack, body: req.body });
    res.status(500).json({ message: 'Error placing order', error: err.message });
  }
});

// Confirm Order (Initiate order request)
app.post('/api/confirm-order/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order || order.buyerUsername !== req.user.sellerName) {
      return res.status(404).json({ message: 'Order not found or unauthorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is not in a pending state' });
    }

    let notification = await Notification.findOne({ orderId: order._id });
    if (!notification) {
      notification = new Notification({
        orderId: order._id,
        buyerUsername: order.buyerUsername,
        sellerName: order.sellerName,
        deliveryAddress: order.deliveryAddress,
      });
      await notification.save();
    }

    const seller = await User.findOne({ username: order.sellerName });
    if (seller && seller.email && seller.notifications) {
      try {
        await sendEmailNotification(
          seller.email,
          order.buyerUsername,
          order.deliveryAddress,
          order._id
        );
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr.message);
      }
    }

    res.json({
      message: 'Order request sent to producer successfully',
      orderId: order._id,
      redirect: '/your-orders',
    });
  } catch (err) {
    console.error('Confirm order error:', err.message, { orderId: req.params.orderId, user: req.user.sellerName });
    res.json({
      message: 'Order request sent to producer successfully (with errors)',
      orderId: req.params.orderId,
      redirect: '/your-orders',
    });
  }
});

// Verify Payment
app.post('/api/verify-payment', authenticateToken, async (req, res) => {
  const { orderId, paymentId } = req.body;

  try {
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const payment = await razorpayInstance.payments.fetch(paymentId);
    if (payment.status === 'captured') {
      res.json({ message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ message: 'Payment not captured' });
    }
  } catch (err) {
    console.error('Verify payment error:', err.message);
    res.status(500).json({ message: 'Error verifying payment', error: err.message });
  }
});

// Fetch Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ sellerName: req.user.sellerName }).populate('orderId').lean();
    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: 'No notifications found' });
    }
    res.json(notifications.map(n => ({
      _id: n._id,
      orderId: n.orderId._id,
      buyerUsername: n.buyerUsername,
      deliveryAddress: n.orderId.deliveryAddress,
      status: n.status,
      createdAt: n.createdAt,
    })));
  } catch (err) {
    console.error('Fetch notifications error:', err.message, { user: req.user.sellerName });
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
});

// Handle Notification Action
app.post('/api/notification-action/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  try {
    const notification = await Notification.findById(id);
    if (!notification || notification.sellerName !== req.user.sellerName) {
      return res.status(404).json({ message: 'Notification not found or unauthorized' });
    }
    if (!['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    notification.status = action;
    await notification.save();
    const order = await Order.findById(notification.orderId);
    order.status = action === 'accepted' ? 'confirmed' : 'declined';
    await order.save();
    if (action === 'accepted') {
      const product = await Product.findById(order.productId);
      if (product) {
        product.quantity -= order.quantity;
        await product.save();
      }
    }
    const buyer = await User.findOne({ username: notification.buyerUsername });
    if (buyer && buyer.email && buyer.notifications) {
      await transporter.sendMail({
        from: `"Nutri Store" <${process.env.EMAIL_USER}>`,
        to: buyer.email,
        subject: `Order ${action === 'accepted' ? 'Processed' : 'Declined'}`,
        text: `Your order #${order._id} has been ${action} on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. ${action === 'accepted' ? 'Go to Your Orders page.' : 'Try another product.'}`,
      });
    }
    res.json({ message: `Notification ${action} successfully` });
  } catch (err) {
    console.error('Notification action error:', err.message);
    res.status(500).json({ message: 'Error processing notification action', error: err.message });
  }
});

// Delete Notification
app.delete('/api/notification-action/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.sellerName !== req.user.sellerName) {
      return res.status(404).json({ message: 'Notification not found or unauthorized' });
    }
    await notification.deleteOne();
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Delete notification error:', err.message);
    res.status(500).json({ message: 'Error deleting notification', error: err.message });
  }
});

// Fetch Your Orders
app.get('/api/your-orders', authenticateToken, async (req, res) => {
  try {
    const query = req.user.userType === 'Producer'
      ? { sellerName: req.user.sellerName }
      : { buyerUsername: req.user.sellerName };
    const orders = await Order.find(query).populate('productId').lean().sort({ orderDate: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found' });
    }

    const ordersWithMobile = await Promise.all(orders.map(async (order) => {
      const buyer = await User.findOne({ username: order.buyerUsername }, 'mobileNumber').lean();
      const mobileNo = buyer?.mobileNumber || 'Not provided';

      let expectedDeliveryDate = null;
      if (order.orderDate) {
        const deliveryDate = new Date(order.orderDate);
        deliveryDate.setDate(deliveryDate.getDate() + 3);
        expectedDeliveryDate = deliveryDate;
      }

      return {
        _id: order._id,
        orderId: order.orderId,
        buyerUsername: order.buyerUsername,
        sellerName: order.sellerName,
        productId: order.productId?._id,
        itemName: order.productId?.itemName,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        deliveryAddress: order.deliveryAddress,
        mobileNo,
        paymentMethod: order.paymentMethod,
        status: order.status,
        orderDate: order.orderDate,
        expectedDeliveryDate,
      };
    }));

    res.json(ordersWithMobile);
  } catch (err) {
    console.error('Fetch orders error:', err.message, { user: req.user.sellerName });
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
});

// Handle Order Action (Accept/Decline)
app.post('/api/order-action/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.userType === 'Producer' && order.sellerName !== req.user.sellerName) {
      return res.status(403).json({ message: 'Unauthorized to perform action on this order' });
    }

    order.status = action === 'accepted' ? 'confirmed' : 'declined';
    await order.save();

    const notification = await Notification.findOne({ orderId: order._id });
    if (notification) {
      notification.status = action;
      await notification.save();
    }

    if (action === 'accepted') {
      const product = await Product.findById(order.productId);
      if (product) {
        if (product.quantity < order.quantity) {
          return res.status(400).json({ message: 'Insufficient stock to accept order' });
        }
        product.quantity -= order.quantity;
        await product.save();
      }
    }

    const counterparty = await User.findOne({ username: order.buyerUsername });
    if (counterparty && counterparty.email && counterparty.notifications) {
      try {
        await transporter.sendMail({
          from: `"Nutri Store" <${process.env.EMAIL_USER}>`,
          to: counterparty.email,
          subject: `Order ${action === 'accepted' ? 'Accepted' : 'Declined'}`,
          text: `Your order #${order._id} has been ${action} on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. ${action === 'accepted' ? 'Your order is being processed.' : 'Please contact support or try another product.'}`,
        });
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr.message);
      }
    }

    res.json({ message: `Order ${action} successfully` });
  } catch (err) {
    console.error('Order action error:', err.message, { orderId: id, user: req.user.sellerName, stack: err.stack });
    res.status(500).json({ message: 'Error processing order action', error: err.message });
  }
});

// Fetch Chat Messages
app.get('/api/chat-messages/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }
    const messages = await Message.find({ orderId }).lean();
    if (!messages || messages.length === 0) {
      return res.json([]); // Return empty array if no messages
    }
    res.json(messages);
  } catch (err) {
    console.error('Fetch chat messages error:', err.message, { orderId: req.params.orderId });
    res.status(500).json({ message: 'Error fetching chat messages', error: err.message });
  }
});

// Send Message
app.post('/api/send-message', authenticateToken, async (req, res) => {
  try {
    const { orderId, sender, receiver, message } = req.body;

    if (!orderId || !sender || !receiver || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isBuyer = order.buyerUsername === req.user.sellerName;
    const isSeller = order.sellerName === req.user.sellerName;
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Unauthorized to send message for this order' });
    }

    if (sender !== req.user.sellerName) {
      return res.status(403).json({ message: 'Sender mismatch' });
    }

    if (receiver !== (isBuyer ? order.sellerName : order.buyerUsername)) {
      return res.status(400).json({ message: 'Receiver mismatch' });
    }

    const newMessage = new Message({
      orderId,
      sender,
      receiver,
      message,
    });
    const savedMessage = await newMessage.save();

    const receiverUser = await User.findOne({ username: receiver });
    if (receiverUser && receiverUser.email && receiverUser.notifications) {
      try {
        await transporter.sendMail({
          from: `"Nutri Store" <${process.env.EMAIL_USER}>`,
          to: receiverUser.email,
          subject: 'New Message Received',
          text: `You have a new message from ${sender} regarding order #${orderId} on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Check the app to reply.`,
        });
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr.message);
      }
    }

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Send message error:', err.message, { body: req.body, stack: err.stack });
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});

// New Endpoint: Fetch Recently Added Products
app.get('/api/products/new', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log(`Fetching new products with limit: ${limit}`);
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    console.log('Found products:', products);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No new products found' });
    }

    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.itemName, // Map itemName to name
      image: product.image || '', // Ensure image is provided
      price: product.price || 0, // Default price if missing
      listDate: product.createdAt,
    }));

    res.json(formattedProducts);
  } catch (err) {
    console.error('Fetch new products error:', err.message, { stack: err.stack });
    res.status(500).json({ message: 'Error fetching new products', error: err.message });
  }
});

// Premium Products Endpoint
app.get('/api/products/premium', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    console.log(`Fetching premium products with limit: ${limit}`);
    const products = await Product.find()
      .sort({ price: -1 })
      .limit(limit)
      .lean();
    console.log('Found premium products:', products);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No premium products found' });
    }

    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.itemName, // Map itemName to name
      image: product.image || '', // Ensure image is provided
      price: product.price || 0, // Default price if missing
    }));

    res.json(formattedProducts);
  } catch (err) {
    console.error('Fetch premium products error:', err.message, { stack: err.stack });
    res.status(500).json({ message: 'Error fetching premium products', error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
});