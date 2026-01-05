require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');   // ✅ import path
const pool = require('./config/db');

const app = express();

// ✅ CORS Configuration - เรียบง่ายเพราะ Vercel proxy ทำให้ same-origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://test-frontend-dev-mu.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('🌍 Allowed CORS Origins:', allowedOrigins);

// ✅ CORS - อนุญาตทุก origin เพราะ Vercel proxy ทำให้ปลอดภัยอยู่แล้ว
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

// ✅ Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Request logger
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} | Origin: ${req.headers.origin || 'none'}`);
  next();
});

// ✅ Static files - รองรับทั้ง uploads/ และ public/uploads/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ✅ Import routes
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/uploads');
const cartRoutes = require('./routes/cart');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const uploadMiddleware = require('./middlewares/upload');
const adminRoutes = require('./routes/admin');
const { verifyToken } = require('./middlewares/auth');
const verifySlipRoute = require('./routes/verifySlip');

// ✅ Log environment info
console.log("🔐 PromptPay ID:", process.env.PROMPTPAY_ID);
console.log("🌍 PUBLIC_ORIGIN:", process.env.PUBLIC_ORIGIN || 'http://localhost:4000');

// ✅ Mount routes
app.use('/api/payments', verifySlipRoute);
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', verifyToken, adminRoutes);
// auth
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// users
app.use('/api/users', verifyToken, userRoutes);

// orders & cart
app.use('/api/orders', verifyToken, orderRoutes);
app.use('/api/cart', verifyToken, cartRoutes);

// products (public ดูได้, CRUD ไปใส่ verifyToken ใน route แทน)
app.use('/api/products', productRoutes);

// ✅ Health check endpoint (สำหรับตรวจสอบว่า server ทำงาน)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ CORS test endpoint
app.get('/api/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin || 'no-origin',
    allowedOrigins: allowedOrigins,
    timestamp: new Date().toISOString()
  });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ ใช้ PORT จาก environment variable (Railway ใช้ dynamic port)
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Server URL: http://0.0.0.0:${PORT}`);
  console.log(`📋 Allowed CORS Origins:`, allowedOrigins);
});
// ===== Auto complete shipment to 'done' after 10 days =====
// จะรันทุก 1 ชั่วโมง (ปรับได้) โดยยึดจาก orders.updated_at เป็นเวลาที่เข้าสถานะ shipping
const ONE_HOUR = 60 * 60 * 1000;

async function autoCompleteOldShipping() {
  try {
    const [result] = await pool.query(
      `
      UPDATE orders o
      LEFT JOIN deliveries d ON d.order_id = o.order_id
      SET 
        o.status = 'done',
        o.updated_at = NOW(),
        d.status = 'done'
      WHERE 
        o.status = 'shipping'
        AND TIMESTAMPDIFF(DAY, o.updated_at, NOW()) >= 10
      `
    );
    if (result.affectedRows) {
      console.log(`[AUTO-DONE] marked ${result.affectedRows} order(s) as done`);
    }
  } catch (err) {
    console.error('[AUTO-DONE_ERROR]', err);
  }
}

// รันทันทีหนึ่งครั้งตอนบูต และตั้ง interval
autoCompleteOldShipping();
setInterval(autoCompleteOldShipping, ONE_HOUR);
