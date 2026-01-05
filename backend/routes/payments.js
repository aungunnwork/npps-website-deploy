const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ✅ ดึงข้อมูล QR ของออเดอร์ตาม order_id
router.get('/by-order/:orderId', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // เผื่อ cors
  const { orderId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT qr_image_url, qr_payload, amount_expected, bill_ref
       FROM payments WHERE order_id = ? LIMIT 1`,
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลการชำระเงินของออเดอร์นี้' });
    }

    // ✅ ใช้ PUBLIC_ORIGIN จาก env หรือ fallback localhost (dev)
    const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'http://localhost:4000';

    res.json({
      ...rows[0],
      qr_image_url: rows[0].qr_image_url
        ? `${PUBLIC_ORIGIN}${rows[0].qr_image_url}`
        : null
    });

  } catch (err) {
    console.error('Error fetching payment QR:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
