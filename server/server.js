const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'Uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/mkv', 'video/webm', 'video/avi'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const uploadProfile = multer({ storage, fileFilter }).single('photo');
const uploadProduct = multer({ storage, fileFilter }).fields([
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

// Schemas and Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  userType: { type: String, enum: ['Producer', 'Consumer'], required: true },
  otp: String,
  otpExpires: Date,
  name: String,
  photo: String,
  address: String,
  occupation: String,
  kisanCard: { type: String },
  farmerId: { type: String },
  bank: {
    accountNumber: { type: String },
    bankName: { type: String },
    branch: { type: String },
    ifsc: { type: String },
    accountHolderName: { type: String },
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
userSchema.index({ email: 1, userType: 1 }, { unique: true });
const User = mongoose.model('User', userSchema);

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

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  buyerUsername: { type: String, required: true },
  sellerName: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String, required: true }, // Made transactionId required
  status: { type: String, enum: ['pending', 'accepted', 'confirmed', 'paid', 'declined'], default: 'pending' },
  orderDate: { type: Date, default: Date.now },
});
const Order = mongoose.model('Order', orderSchema);

const cartSchema = new mongoose.Schema({
  username: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
});
const Cart = mongoose.model('Cart', cartSchema);

const notificationSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  buyerUsername: { type: String, required: true },
  sellerName: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const Notification = mongoose.model('Notification', notificationSchema);

const messageSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model('Message', messageSchema);

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  mobile: { type: String },
  email: { type: String },
  address: { type: String },
  occupation: { type: String },
  photo: { type: String },
  bank: {
    accountNumber: { type: String },
    bankName: { type: String },
    branch: { type: String },
    ifsc: { type: String },
    accountHolderName: { type: String },
  },
  kisanCard: { type: String },
  farmerId: { type: String },
  listedItems: { type: Number, default: 0 },
  monthlyIncome: { type: Number, default: 0 },
  buyersCount: { type: Number, default: 0 },
  quantitySold: { type: Number, default: 0 },
  upiId: { type: String },
  createdAt: { type: Date, default: Date.now },
  completionPercentage: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verifiedBy: { type: String },
});
const Profile = mongoose.model('Profile', profileSchema);

// Email transporter
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

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

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

// Routes
app.post('/api/signup', async (req, res) => {
  const { username, email, password, mobileNumber, userType, name, address, occupation, kisanCard, farmerId, bank } = req.body;
  try {
    if (!username || !email || !password || !mobileNumber || !userType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const validTypes = ['Producer', 'Consumer'];
    if (!validTypes.includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    const emailExists = await User.findOne({ email, userType });
    if (emailExists) {
      return res.status(400).json({ message: 'User with this email and type already exists' });
    }

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
      bank: userType === 'Producer' ? bank : undefined,
      verified: userType === 'Producer' ? false : true,
    });
    await newUser.save();

    const profile = new Profile({ userId: newUser._id, name, mobile: mobileNumber, email, address, occupation });
    await profile.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Signup error', error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password, userType } = req.body;
  try {
    const user = await User.findOne({ email, userType });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    const accessToken = jwt.sign({ sellerName: user.username, userType: user.userType }, SECRET_KEY, { expiresIn: '8h' });
    const refreshToken = jwt.sign({ sellerName: user.username, userType: user.userType }, SECRET_KEY, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    await user.save();

    const profile = await Profile.findOne({ userId: user._id }) || new Profile({ userId: user._id });
    const requiredFields = ['name', 'mobile', 'email', 'address', 'occupation', 'photo'];
    const roleSpecificFields = userType === 'Producer' ? ['kisanCard', 'farmerId'] : [];
    const totalFields = [...requiredFields, ...roleSpecificFields];
    const filledFields = totalFields.filter(field => profile[field]).length;
    const completionPercentage = (filledFields / totalFields.length) * 100;

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      userType: user.userType,
      username: user.username,
      profile: { completionPercentage, verified: profile.verified },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

app.post('/api/refresh-token', async (req, res) => {
  const { token: refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

    jwt.verify(refreshToken, SECRET_KEY, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid refresh token' });

      const accessToken = jwt.sign({ sellerName: user.username, userType: user.userType }, SECRET_KEY, { expiresIn: '8h' });
      res.json({ token: accessToken });
    });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    res.status(500).json({ message: 'Error refreshing token', error: err.message });
  }
});

app.post('/api/send-otp', async (req, res) => {
  const { email, userType } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log(`Sending OTP for email: ${email}, userType: ${userType}, stored userType: ${user.userType}`);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    if (transporterReady) {
      await transporter.sendMail({
        from: `"Nutri Store" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'OTP Login',
        text: `Your OTP is ${otp}. It expires in 5 minutes. User Type: ${user.userType}.`,
      });
    }

    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  const { email, otp, userType } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log(`Verifying OTP for email: ${email}, received userType: ${userType}, stored userType: ${user.userType}`);

    if (userType && user.userType !== userType) {
      console.warn(`User type mismatch: received ${userType}, stored ${user.userType}. Using stored userType.`);
    }

    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const accessToken = jwt.sign({ sellerName: user.username, userType: user.userType }, SECRET_KEY, { expiresIn: '8h' });
    const refreshToken = jwt.sign({ sellerName: user.username, userType: user.userType }, SECRET_KEY, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    await user.save();

    const profile = await Profile.findOne({ userId: user._id }) || new Profile({ userId: user._id });
    const requiredFields = ['name', 'mobile', 'email', 'address', 'occupation', 'photo'];
    const roleSpecificFields = user.userType === 'Producer' ? ['kisanCard', 'farmerId'] : [];
    const totalFields = [...requiredFields, ...roleSpecificFields];
    const filledFields = totalFields.filter(field => profile[field]).length;
    const completionPercentage = (filledFields / totalFields.length) * 100;

    res.json({
      verified: true,
      message: 'OTP verified successfully',
      token: accessToken,
      refreshToken,
      userType: user.userType,
      username: user.username,
      profile: { completionPercentage, verified: profile.verified },
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
});

app.post('/api/send-action-otp', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.sellerName });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    if (transporterReady) {
      await transporter.sendMail({
        from: `"Nutri Store" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Nutri Store Action Verification OTP',
        text: `Your OTP for action verification is ${otp}. It expires in 5 minutes.`,
      });
    }

    res.json({ message: 'OTP sent successfully to your registered email' });
  } catch (err) {
    console.error('Send action OTP error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

app.post('/api/verify-action-otp', authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findOne({ username: req.user.sellerName });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ verified: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify action OTP error:', err.message);
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
});

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

    const profile = await Profile.findOne({ userId: user._id }).lean() || {};

    const requiredFields = ['name', 'mobile', 'email', 'address', 'occupation', 'photo'];
    const roleSpecificFields = user.userType === 'Producer' ? ['kisanCard', 'farmerId'] : [];
    const totalFields = [...requiredFields, ...roleSpecificFields];
    const filledFields = totalFields.filter(field => profile[field]).length;
    const completionPercentage = (filledFields / totalFields.length) * 100;

    res.json({
      ...user,
      ...dashboardMetrics,
      ...profile,
      completionPercentage,
    });
  } catch (err) {
    console.error('Fetch profile error:', err.message);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

app.put('/api/profile', authenticateToken, uploadProfile, async (req, res) => {
  try {
    const { name, mobile, email, address, occupation, kisanCard, farmerId, upiId } = req.body;
    const user = await User.findOne({ username: req.user.sellerName });
    if (!user) throw new Error('User not found');

    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      profile = new Profile({ userId: user._id });
    }

    profile.name = name || profile.name;
    profile.mobile = mobile || profile.mobile;
    profile.email = email || profile.email;
    profile.address = address || profile.address;
    profile.occupation = occupation || profile.occupation;
    if (req.user.userType === 'Producer') {
      profile.kisanCard = kisanCard || profile.kisanCard;
      profile.farmerId = farmerId || profile.farmerId;
      profile.upiId = upiId || profile.upiId;
    }
    if (req.file) {
      profile.photo = `/Uploads/${req.file.filename}`;
    }

    const requiredFields = ['name', 'mobile', 'email', 'address', 'occupation', 'photo'];
    const roleSpecificFields = req.user.userType === 'Producer' ? ['kisanCard', 'farmerId'] : [];
    const totalFields = [...requiredFields, ...roleSpecificFields];
    const filledFields = totalFields.filter(field => profile[field]).length;
    const completionPercentage = (filledFields / totalFields.length) * 100;
    profile.completionPercentage = completionPercentage;

    if (completionPercentage === 100) {
      profile.verified = true;
      profile.verifiedBy = req.user.userType === 'Producer' ? 'NutriStore Certified Farmer' : 'NutriStore Certified Buyer';
    } else {
      profile.verified = false;
      profile.verifiedBy = null;
    }

    await profile.save();
    res.json({ message: 'Profile updated successfully', profile, redirect: completionPercentage < 100 ? '/edit-profile' : null });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
});

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
      { $set: { 'bank.accountNumber': accountNumber, 'bank.bankName': bankName, 'bank.branch': branch, 'bank.ifsc': ifsc, 'bank.accountHolderName': accountHolderName, verified: false } },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = await Profile.findOne({ userId: user._id });
    if (profile) {
      profile.bank = { accountNumber, bankName, branch, ifsc, accountHolderName };
      await profile.save();
    }

    res.json({ message: 'Bank details updated successfully' });
  } catch (err) {
    console.error('Update bank details error:', err.message);
    res.status(500).json({ message: 'Error updating bank details', error: err.message });
  }
});

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

app.delete('/api/delete-account', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.sellerName });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Promise.all([
      Product.deleteMany({ sellerName: user.username }),
      Cart.deleteMany({ username: user.username }),
      Order.deleteMany({ $or: [{ sellerName: user.username }, { buyerUsername: user.username }] }),
      Profile.deleteOne({ userId: user._id }),
      user.deleteOne(),
    ]);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ message: 'Error deleting account', error: err.message });
  }
});

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

app.post('/api/submit-product', authenticateToken, uploadProduct, async (req, res) => {
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

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity);
    const parsedDeliveryTime = parseInt(deliveryTime);
    if (isNaN(parsedPrice) || isNaN(parsedQuantity) || isNaN(parsedDeliveryTime)) {
      return res.status(400).json({ message: 'Invalid numeric values' });
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
    await User.findOneAndUpdate(
      { username: req.user.sellerName },
      { $inc: { listedItems: 1 } },
      { new: true }
    );

    res.status(201).json({ message: 'Product submitted successfully', product: savedProduct });
  } catch (err) {
    console.error('Submit product error:', err.message);
    res.status(500).json({ message: 'Error submitting product', error: err.message });
  }
});

app.get('/api/products/your', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'Producer') {
      return res.status(403).json({ message: 'Only Producers can fetch their products' });
    }

    const products = await Product.find({ sellerName: req.user.sellerName }).lean();
    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    res.json(products);
  } catch (err) {
    console.error('Fetch your products error:', err.message);
    res.status(500).json({ message: 'Error fetching your products', error: err.message });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'Producer') {
      return res.status(403).json({ message: 'Only Producers can delete products' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerName !== req.user.sellerName) {
      return res.status(403).json({ message: 'Unauthorized to delete this product' });
    }

    await product.deleteOne();
    await User.findOneAndUpdate(
      { username: req.user.sellerName },
      { $inc: { listedItems: -1 } },
      { new: true }
    );

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

app.put('/api/products/:id', authenticateToken, uploadProduct, async (req, res) => {
  try {
    if (req.user.userType !== 'Producer') {
      return res.status(403).json({ message: 'Only Producers can update products' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerName !== req.user.sellerName) {
      return res.status(403).json({ message: 'Unauthorized to update this product' });
    }

    const { itemName, price, location, unit, quantity, harvestCondition, deliveryTime, expiryDate, offers } = req.body;
    const image = req.files?.image ? `/Uploads/${req.files.image[0].filename}` : product.image;
    const video = req.files?.video ? `/Uploads/${req.files.video[0].filename}` : product.video;

    const updateData = {
      itemName: itemName || product.itemName,
      price: price ? parseFloat(price) : product.price,
      location: location || product.location,
      unit: unit || product.unit,
      quantity: quantity ? parseInt(quantity) : product.quantity,
      harvestCondition: harvestCondition || product.harvestCondition,
      deliveryTime: deliveryTime ? parseInt(deliveryTime) : product.deliveryTime,
      expiryDate: expiryDate ? new Date(expiryDate) : product.expiryDate,
      offers: offers !== undefined ? offers : product.offers,
      image,
      video,
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { sort, limit, search } = req.query;
    const query = Product.find().lean();

    if (search) {
      query.where('itemName').regex(new RegExp(search, 'i'));
    }

    if (sort) {
      const sortOptions = sort.split(',').reduce((acc, s) => {
        const [field, order] = s.split(':');
        acc[field] = order === 'desc' ? -1 : 1;
        return acc;
      }, {});
      query.sort(sortOptions);
    } else {
      query.sort({ createdAt: -1 });
    }

    if (limit) {
      query.limit(parseInt(limit) || 10);
    }

    const products = await query;
    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    res.json(products);
  } catch (err) {
    console.error('Fetch products error:', err.message);
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
});

app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.user.userType === 'Producer' && product.sellerName !== req.user.sellerName) {
      return res.status(403).json({ message: 'Unauthorized to view this product' });
    }

    res.json(product);
  } catch (err) {
    console.error('Fetch product error:', err.message);
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
});

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

    res.status(200).json({});
  } catch (err) {
    console.error('Add to cart error:', err.message);
    res.status(500).json({ message: 'Error adding to cart', error: err.message });
  }
});

app.post('/api/place-order', authenticateToken, async (req, res) => {
  const { cart, deliveryAddress, paymentMethod, total, transactionId } = req.body;
  try {
    if (!deliveryAddress || !paymentMethod || !cart || cart.length === 0 || !transactionId) {
      return res.status(400).json({ message: 'Missing required fields: deliveryAddress, paymentMethod, cart, and transactionId are required' });
    }

    if (!['upi', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method. Use "upi" or "cod"' });
    }

    const orderId = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const orders = [];

    for (const item of cart) {
      if (!mongoose.Types.ObjectId.isValid(item._id)) {
        return res.status(400).json({ message: `Invalid product ID format for item ${item._id}` });
      }

      const product = await Product.findById(item._id);
      if (!product) {
        return res.status(404).json({ message: `Product not found for ID: ${item._id}` });
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
        transactionId, // Assign the transactionId to each order
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

    // Convert total to paise before sending to frontend
    const totalInPaise = parseFloat(total) * 100;

    // Log the total for debugging
    console.log(`Order total in rupees: ${total}, total in paise: ${totalInPaise}, transactionId: ${transactionId}`);

    res.json({ 
      message: 'Order placed successfully', 
      orderId, 
      status: 'pending', 
      redirect: '/your-orders',
      total: totalInPaise, // Send total in paise
      paymentNote: 'The amount is provided in paise. Pass this value directly to your UPI integration.'
    });
  } catch (err) {
    console.error('Place order error:', err.message);
    res.status(500).json({ message: 'Error placing order', error: err.message });
  }
});
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

    let notification = await Notification.findOne({ orderId: order._id, buyerUsername: order.buyerUsername });
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
        await sendEmailNotification(seller.email, order.buyerUsername, order.deliveryAddress, order._id);
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
    console.error('Confirm order error:', err.message);
    res.status(500).json({ message: 'Error confirming order', error: err.message });
  }
});

app.post('/api/verify-payment', authenticateToken, async (req, res) => {
  // Placeholder for future payment gateway integration
  res.status(400).json({ message: 'Payment verification not supported without payment gateway. Use chat to confirm with the seller.' });
});

app.get('/api/get-upi-id', authenticateToken, async (req, res) => {
  try {
    const { sellerName } = req.query;
    if (!sellerName) {
      return res.status(400).json({ message: 'Seller name is required' });
    }

    const seller = await User.findOne({ username: sellerName }).lean();
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const profile = await Profile.findOne({ userId: seller._id }).lean();
    if (!profile || !profile.upiId) {
      return res.status(404).json({ message: 'UPI ID not found for this seller' });
    }

    res.json({ upiId: profile.upiId });
  } catch (err) {
    console.error('Fetch UPI ID error:', err.message);
    res.status(500).json({ message: 'Error fetching UPI ID', error: err.message });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.sellerName });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let notifications;
    if (user.userType === 'Producer') {
      notifications = await Notification.find({ sellerName: req.user.sellerName }).populate('orderId').lean();
    } else {
      notifications = await Notification.find({ buyerUsername: req.user.sellerName }).populate('orderId').lean();
    }

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: 'No notifications found' });
    }

    res.json(notifications.map(n => ({
      _id: n._id,
      orderId: n.orderId?._id,
      buyerUsername: n.buyerUsername,
      sellerName: n.sellerName,
      deliveryAddress: n.deliveryAddress,
      status: n.status,
      message: n.message,
      createdAt: n.createdAt,
    })));
  } catch (err) {
    console.error('Fetch notifications error:', err.message);
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
});

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
    res.json({ message: `Notification ${action} successfully` });
  } catch (err) {
    console.error('Notification action error:', err.message);
    res.status(500).json({ message: 'Error processing notification action', error: err.message });
  }
});

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
        transactionId: order.transactionId, // Include transactionId in response
        status: order.status,
        orderDate: order.orderDate,
        expectedDeliveryDate,
      };
    }));

    res.json(ordersWithMobile);
  } catch (err) {
    console.error('Fetch orders error:', err.message);
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
});

app.post('/api/order-action/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.userType === 'Producer' && order.sellerName !== req.user.sellerName) {
      return res.status(403).json({ message: 'Unauthorized to perform action on this order' });
    }

    order.status = action;
    await order.save();

    let buyerNotification = await Notification.findOne({ orderId: order._id, buyerUsername: order.buyerUsername });
    const expectedDeliveryDate = action === 'accepted' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : null;
    if (!buyerNotification) {
      buyerNotification = new Notification({
        orderId: order._id,
        buyerUsername: order.buyerUsername,
        sellerName: order.sellerName,
        deliveryAddress: order.deliveryAddress,
        status: action,
        message: action === 'accepted'
          ? `Your order #${order._id} has been accepted on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Expected delivery by ${expectedDeliveryDate}.`
          : `Your order #${order._id} has been declined on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Please contact support or try another product.`,
      });
    } else {
      buyerNotification.status = action;
      buyerNotification.message = action === 'accepted'
        ? `Your order #${order._id} has been accepted on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Expected delivery by ${expectedDeliveryDate}.`
        : `Your order #${order._id} has been declined on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Please contact support or try another product.`;
    }
    await buyerNotification.save();

    let producerNotification = await Notification.findOne({ orderId: order._id, sellerName: order.sellerName });
    if (!producerNotification) {
      producerNotification = new Notification({
        orderId: order._id,
        buyerUsername: order.buyerUsername,
        sellerName: order.sellerName,
        deliveryAddress: order.deliveryAddress,
        status: action,
        message: `Order #${order._id} from ${order.buyerUsername} has been ${action}.`,
      });
    } else {
      producerNotification.status = action;
      producerNotification.message = `Order #${order._id} from ${order.buyerUsername} has been ${action}.`;
    }
    await producerNotification.save();

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
          text: action === 'accepted'
            ? `Your order #${order._id} has been accepted on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Expected delivery by ${expectedDeliveryDate}.`
            : `Your order #${order._id} has been declined on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Please contact support or try another product.`,
        });
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr.message);
      }
    }

    res.json({ message: `Order ${action} successfully`, status: action });
  } catch (err) {
    console.error('Order action error:', err.message);
    res.status(500).json({ message: 'Error processing order action', error: err.message });
  }
});

app.get('/api/chat-messages/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }
    const messages = await Message.find({ orderId }).lean();
    res.json(messages || []);
  } catch (err) {
    console.error('Fetch chat messages error:', err.message);
    res.status(500).json({ message: 'Error fetching chat messages', error: err.message });
  }
});

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
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.buyerUsername === req.user.sellerName;
    const isSeller = order.sellerName === req.user.sellerName;
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Unauthorized to send message' });
    }

    if (sender !== req.user.sellerName) {
      return res.status(403).json({ message: 'Sender mismatch' });
    }

    if (receiver !== (isBuyer ? order.sellerName : order.buyerUsername)) {
      return res.status(400).json({ message: 'Receiver mismatch' });
    }

    const newMessage = new Message({ orderId, sender, receiver, message });
    const savedMessage = await newMessage.save();

    const receiverUser = await User.findOne({ username: receiver });
    if (receiverUser && receiverUser.email && receiverUser.notifications) {
      try {
        await transporter.sendMail({
          from: `"Nutri Store" <${process.env.EMAIL_USER}>`,
          to: receiverUser.email,
          subject: 'New Message Received',
          text: `You have a new message from ${sender} regarding order #${orderId}. Check the app to reply.`,
        });
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr.message);
      }
    }

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Send message error:', err.message);
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});

app.get('/api/products/new', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No new products found' });
    }
    res.json(products);
  } catch (err) {
    console.error('Fetch new products error:', err.message);
    res.status(500).json({ message: 'Error fetching new products', error: err.message });
  }
});

app.get('/api/products/most-sold', authenticateToken, async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      return res.status(404).json({ message: 'No sales data available' });
    }

    const mostSold = await Order.aggregate([
      { $match: { quantity: { $exists: true, $gt: 0 } } },
      { $group: { _id: '$productId', totalSold: { $sum: '$quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: '$product._id',
          itemName: '$product.itemName',
          image: '$product.image',
          price: '$product.price',
          quantity: '$product.quantity',
        },
      },
    ]).exec();

    if (!mostSold || mostSold.length === 0) {
      return res.status(404).json({ message: 'No most sold items found' });
    }

    res.json(mostSold);
  } catch (err) {
    console.error('Fetch most sold error:', err.message);
    res.status(500).json({ message: 'Error fetching most sold items', error: err.message });
  }
});

app.get('/api/products/premium', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const products = await Product.find()
      .sort({ price: -1 })
      .limit(limit)
      .lean();
    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No premium products found' });
    }

    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.itemName,
      image: product.image || '',
      price: product.price || 0,
    }));

    res.json(formattedProducts);
  } catch (err) {
    console.error('Fetch premium products error:', err.message);
    res.status(500).json({ message: 'Error fetching premium products', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
});