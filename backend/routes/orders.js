const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload'); // << เพิ่ม

// POST /api/orders
router.post('/', verifyToken, upload.single('slip'), async (req, res) => {
  const uid = req.user.uid;

  let items = [];
  try {
    items = JSON.parse(req.body.items || '[]');
  } catch (e) {
    return res.status(400).json({ message: 'items ต้องเป็น JSON array' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'ตะกร้าว่าง' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ดึงราคาจริงจาก DB
    const ids = items.map(i => i.product_id);
    const [rows] = await conn.query(
      `SELECT product_id, price FROM products WHERE product_id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    const priceMap = new Map(rows.map(r => [r.product_id, Number(r.price)]));

    let total = 0;
    for (const item of items) {
      const price = priceMap.get(item.product_id);
      if (price == null) throw new Error(`สินค้า id=${item.product_id} ไม่มีอยู่`);
      total += price * Number(item.quantity || 0);
    }

    // insert order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, status, total_price) VALUES (?, ?, ?)',
      [uid, 'pending', total]
    );
    const orderId = orderResult.insertId;

    // insert order_items
    const values = items.map(i => [orderId, i.product_id, i.quantity, priceMap.get(i.product_id)]);
    await conn.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
      [values]
    );

    // ✅ ตัดสต็อกจาก products
    for (const item of items) {
      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE product_id = ? AND stock >= ?',
        [item.quantity, item.product_id, item.quantity]
      );
    }

    // insert payment (เก็บ slip ที่แนบมาตอนสร้างออเดอร์ ถ้ามี)
    const slipUrl = req.file ? `/uploads/slips/${req.file.filename}` : null;
    await conn.query(
      'INSERT INTO payments (order_id, payment_slip_url, status) VALUES (?, ?, ?)',
      [orderId, slipUrl, 'pending']
    );

    // =============================
    // ✅ สร้าง QR PromptPay + bill_ref สำหรับออเดอร์นี้
    // =============================
    const path = require('path');
    const fs = require('fs');
    const qrcode = require('qrcode');
    const generatePayload = require('promptpay-qr');
    const PROMPTPAY_ID = process.env.PROMPTPAY_ID;

    try {
      const amount = Number(total.toFixed(2));
      const rand = Math.random().toString(36).slice(-6).toUpperCase();
      const billRef = `ORD-${orderId}-${rand}`;

      let payload = '';
      try {
        payload = generatePayload(PROMPTPAY_ID, { amount, ref1: billRef });
      } catch {
        payload = generatePayload(PROMPTPAY_ID, { amount });
      }

      const qrRelPath = `/uploads/qr/ord_${orderId}.png`;
      const qrAbsPath = path.join(__dirname, '..', 'public', qrRelPath);

      const qrDir = path.dirname(qrAbsPath);
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

      await qrcode.toFile(qrAbsPath, payload, { margin: 1, width: 360 });

      await conn.query(
        `UPDATE payments
           SET amount_expected=?, qr_payload=?, qr_image_url=?, bill_ref=?
         WHERE order_id=?`,
        [amount, payload, qrRelPath, billRef, orderId]
      );

      console.log(`✅ QR พร้อมเพย์ถูกสร้างแล้ว -> ${qrRelPath} (bill_ref=${billRef})`);
    } catch (err) {
      console.error('[QR_ERROR]', err);
    }

    await conn.commit();
    res.status(201).json({ message: 'สร้างออเดอร์แล้ว', orderId, total, slip: slipUrl });
  } catch (err) {
    await conn.rollback();
    console.error('[ORDER_ERROR]', err);
    res.status(500).json({ message: 'ผิดพลาด', detail: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/orders/my
router.get('/my', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    const [orders] = await pool.query(
      `SELECT o.order_id, o.status, o.total_price, o.created_at, o.updated_at,
              p.payment_slip_url, p.status AS payment_status,
              d.tracking_number
       FROM orders o
       LEFT JOIN payments p ON o.order_id = p.order_id
       LEFT JOIN deliveries d ON o.order_id = d.order_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [uid]
    );

    // ✅ Base URL สำหรับ absolute URL
    const baseUrl = process.env.PUBLIC_ORIGIN || 'http://localhost:4000';

    for (const order of orders) {
      // ✅ แปลง payment_slip_url เป็น absolute URL (ตรวจสอบไม่ให้ซ้อน)
      if (order.payment_slip_url) {
        if (order.payment_slip_url.startsWith('http://') || order.payment_slip_url.startsWith('https://')) {
          // ใช้ของเดิม
        } else if (order.payment_slip_url.startsWith('/')) {
          order.payment_slip_url = `${baseUrl}${order.payment_slip_url}`;
        } else {
          order.payment_slip_url = `${baseUrl}/uploads/slips/${order.payment_slip_url}`;
        }
      }

      const [items] = await pool.query(
        `SELECT oi.product_id, oi.quantity, oi.price,
                pr.product_name, pr.image_url
         FROM order_items oi
         JOIN products pr ON oi.product_id = pr.product_id
         WHERE oi.order_id = ?`,
        [order.order_id]
      );

      // ✅ แปลง image_url เป็น absolute URL (ตรวจสอบไม่ให้ซ้อน)
      order.items = items.map(item => {
        if (item.image_url) {
          if (item.image_url.startsWith('http://') || item.image_url.startsWith('https://')) {
            // ใช้ของเดิม
          } else if (item.image_url.startsWith('/')) {
            item.image_url = `${baseUrl}${item.image_url}`;
          } else {
            item.image_url = `${baseUrl}/uploads/products/${item.image_url}`;
          }
        }
        return item;
      });
    }

    res.json(orders);
  } catch (err) {
    console.error('[ORDER_MY_ERROR]', err);
    res.status(500).json({ message: 'ดึงประวัติคำสั่งซื้อล้มเหลว' });
  }
});

// PATCH /api/orders/:id/cancel  (ลูกค้ายกเลิกออเดอร์ของตัวเอง)
// ❗ แก้ path: ตัดคำว่า "orders/" ออก เพื่อให้ตรงกับ frontend
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT order_id, user_id, status 
       FROM orders 
       WHERE order_id=? AND user_id=? 
       FOR UPDATE`,
      [id, uid]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ หรือไม่มีสิทธิ์ยกเลิก' });
    }
    if (rows[0].status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ message: 'คำสั่งซื้อนี้ไม่สามารถยกเลิกได้' });
    }

    const [items] = await conn.query(
      `SELECT product_id, quantity 
       FROM order_items 
       WHERE order_id=?`,
      [id]
    );

    for (const it of items) {
      await conn.query(
        `UPDATE products 
         SET stock = stock + ? 
         WHERE product_id = ?`,
        [it.quantity, it.product_id]
      );
    }

    await conn.query(
      `UPDATE orders 
       SET status='cancel', updated_at=NOW() 
       WHERE order_id=?`,
      [id]
    );

    await conn.query(
      `UPDATE payments 
       SET status = IF(status='paid','paid','pending') 
       WHERE order_id=?`,
      [id]
    );

    await conn.query(
      `UPDATE deliveries 
       SET status='cancel' 
       WHERE order_id=?`,
      [id]
    );

    await conn.commit();
    return res.json({ message: 'ยกเลิกคำสั่งซื้อเรียบร้อย และคืนสต็อกแล้ว' });
  } catch (err) {
    await conn.rollback();
    console.error('[CANCEL_ORDER_ERROR]', err);
    return res.status(500).json({ message: 'ยกเลิกคำสั่งซื้อล้มเหลว' });
  } finally {
    conn.release();
  }
});

/* ✅ ใหม่: ลูกค้ายืนยันรับสินค้าแล้ว (เฉพาะสถานะ shipping) */
// ❗ แก้ path: ตัดคำว่า "orders/" ออก เพื่อให้ตรงกับ frontend
router.patch('/:id/received', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT order_id, user_id, status
         FROM orders
        WHERE order_id=? AND user_id=?
        FOR UPDATE`,
      [id, uid]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อของผู้ใช้นี้' });
    }
    if (rows[0].status !== 'shipping') {
      await conn.rollback();
      return res.status(400).json({ message: 'ออเดอร์นี้ยังไม่อยู่สถานะจัดส่ง' });
    }

    await conn.query(
      `UPDATE orders SET status='done', updated_at=NOW() WHERE order_id=?`,
      [id]
    );
    await conn.query(
      `UPDATE deliveries SET status='done' WHERE order_id=?`,
      [id]
    );

    await conn.commit();
    res.json({ message: 'อัปเดตเป็น DONE แล้ว' });
  } catch (err) {
    await conn.rollback();
    console.error('[RECEIVED_ERROR]', err);
    res.status(500).json({ message: 'บันทึกการรับสินค้าไม่สำเร็จ' });
  } finally {
    conn.release();
  }
});

module.exports = router;
