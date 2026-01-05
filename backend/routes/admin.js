const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs'); // ใช้เข้ารหัสรหัสผ่าน

// ============ ADMIN ORDERS (หัวออเดอร์ + แนบ items) ============
router.get('/orders', async (req, res) => {
  try {
    // 1) ดึงหัวออเดอร์
    const [orders] = await db.query(`
      SELECT 
        o.order_id,
        o.user_id,
        u.name AS username,
        u.address,
        u.phone,
        o.status AS order_status,
        o.total_price,
        o.created_at,
        p.status AS payment_status,
        p.payment_slip_url,
        d.status AS delivery_status,
        d.tracking_number
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      LEFT JOIN deliveries d ON o.order_id = d.order_id
      ORDER BY o.created_at DESC
    `);

    if (!orders.length) return res.json([]);

    // ✅ Base URL สำหรับ absolute URL
    const baseUrl = process.env.PUBLIC_ORIGIN || 'http://localhost:4000';

    // 2) ดึง items ของออเดอร์ทั้งหมด (ไม่อ้าง product_option แล้ว)
    const orderIds = orders.map(o => o.order_id);
    const placeholders = orderIds.map(() => '?').join(',');
    const [items] = await db.query(
      `
      SELECT
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.product_name,
        p.image_url AS image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id IN (${placeholders})
      ORDER BY oi.order_id ASC
      `,
      orderIds
    );

    // ✅ แปลง image_url เป็น absolute URL (ตรวจสอบไม่ให้ซ้อน)
    items.forEach(item => {
      if (item.image_url) {
        if (item.image_url.startsWith('http://') || item.image_url.startsWith('https://')) {
          // ใช้ของเดิม
        } else if (item.image_url.startsWith('/')) {
          item.image_url = `${baseUrl}${item.image_url}`;
        } else {
          item.image_url = `${baseUrl}/uploads/products/${item.image_url}`;
        }
      }
    });

    // 3) group ตาม order_id
    const map = items.reduce((acc, it) => {
      (acc[it.order_id] ||= []).push(it);
      return acc;
    }, {});

    // 4) แนบ items เข้าออเดอร์ และแปลง slip URL
    const result = orders.map(o => {
      // ✅ แปลง payment_slip_url เป็น absolute URL (ตรวจสอบไม่ให้ซ้อน)
      if (o.payment_slip_url) {
        if (o.payment_slip_url.startsWith('http://') || o.payment_slip_url.startsWith('https://')) {
          // ใช้ของเดิม
        } else if (o.payment_slip_url.startsWith('/')) {
          o.payment_slip_url = `${baseUrl}${o.payment_slip_url}`;
        } else {
          o.payment_slip_url = `${baseUrl}/uploads/slips/${o.payment_slip_url}`;
        }
      }
      
      return {
        ...o,
        items: map[o.order_id] || []
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============ NEW: รายการออเดอร์รายวัน (สำหรับ Dashboard drilldown) ============
router.get('/orders/daily/:date', async (req, res) => {
  try {
    const { date } = req.params; // YYYY-MM-DD
    console.log('[DAILY_ORDERS] Requested date:', date);
    
    // ดึงออเดอร์ของวันนั้น (เวลาไทย) เฉพาะสถานะที่นับในแดชบอร์ด
    const [orders] = await db.query(`
      SELECT 
        o.order_id,
        o.user_id,
        u.name AS username,
        u.address,
        u.phone,
        o.status AS order_status,
        o.total_price,
        o.created_at,
        DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) AS order_date_th,
        p.status AS payment_status,
        p.payment_slip_url,
        d.status AS delivery_status,
        d.tracking_number
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      LEFT JOIN deliveries d ON o.order_id = d.order_id
      WHERE DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) = ?
        AND o.status IN ('pending', 'paid', 'shipping', 'done')
      ORDER BY o.created_at DESC
    `, [date]);
    
    console.log('[DAILY_ORDERS] Found', orders.length, 'orders');
    
    // Debug: ดูว่ามีออเดอร์อะไรบ้างในระบบ
    if (orders.length === 0) {
      const [allOrders] = await db.query(`
        SELECT 
          order_id,
          status,
          DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) AS order_date_th,
          created_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 10
      `);
      console.log('[DAILY_ORDERS] Recent orders in system:', allOrders);
    }

    if (!orders.length) return res.json([]);

    // ✅ Base URL สำหรับ absolute URL
    const baseUrl = process.env.PUBLIC_ORIGIN || 'http://localhost:4000';

    // ดึง items
    const orderIds = orders.map(o => o.order_id);
    const placeholders = orderIds.map(() => '?').join(',');
    const [items] = await db.query(
      `SELECT
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.product_name,
        p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id IN (${placeholders})
      ORDER BY oi.order_id ASC`,
      orderIds
    );

    // ✅ แปลง image_url เป็น absolute URL (ตรวจสอบไม่ให้ซ้อน)
    items.forEach(item => {
      if (item.image_url) {
        if (item.image_url.startsWith('http://') || item.image_url.startsWith('https://')) {
          // ใช้ของเดิม
        } else if (item.image_url.startsWith('/')) {
          item.image_url = `${baseUrl}${item.image_url}`;
        } else {
          item.image_url = `${baseUrl}/uploads/products/${item.image_url}`;
        }
      }
    });

    // group items
    const itemsMap = items.reduce((acc, it) => {
      (acc[it.order_id] ||= []).push(it);
      return acc;
    }, {});

    // แนบ items และแปลง slip URL
    const result = orders.map(o => {
      // ✅ แปลง payment_slip_url เป็น absolute URL (ตรวจสอบไม่ให้ซ้อน)
      if (o.payment_slip_url) {
        if (o.payment_slip_url.startsWith('http://') || o.payment_slip_url.startsWith('https://')) {
          // ใช้ของเดิม
        } else if (o.payment_slip_url.startsWith('/')) {
          o.payment_slip_url = `${baseUrl}${o.payment_slip_url}`;
        } else {
          o.payment_slip_url = `${baseUrl}/uploads/slips/${o.payment_slip_url}`;
        }
      }
      
      return {
        ...o,
        items: itemsMap[o.order_id] || []
      };
    });

    res.json(result);
  } catch (err) {
    console.error('[DAILY_ORDERS_ERROR]', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============ PATCH: update order status + tracking ============
router.patch('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status, tracking_number } = req.body;

  try {
    // update orders
    await db.query(`UPDATE orders SET status=? WHERE order_id=?`, [status, id]);
    // คืนสินค้าเข้าสต็อกถ้ายกเลิก
    if (status === 'cancel') {
      const [items] = await db.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id=?',
        [id]
      );
      for (const item of items) {
        await db.query(
          'UPDATE products SET stock = stock + ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }
      await db.query(`UPDATE payments SET status='cancel' WHERE order_id=?`, [id]);

    }
    // update or insert deliveries
    const [rows] = await db.query(`SELECT * FROM deliveries WHERE order_id=?`, [id]);
    if (rows.length > 0) {
      await db.query(
        `UPDATE deliveries SET tracking_number=?, status=? WHERE order_id=?`,
        [tracking_number, status, id]
      );
    } else {
      const [userData] = await db.query(
        `
        SELECT u.address, u.phone
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        WHERE o.order_id = ?
        `,
        [id]
      );

      const address = userData[0]?.address || '';
      const phone = userData[0]?.phone || '';

      await db.query(
        `INSERT INTO deliveries (order_id, tracking_number, status, address, phone)
         VALUES (?, ?, ?, ?, ?)`,
        [id, tracking_number, status, address, phone]
      );
    }

    // auto update payment status ถ้าเป็น paid
    if (status === 'paid') {
      await db.query(`UPDATE payments SET status='paid', paid_at=NOW() WHERE order_id=?`, [id]);
    }

    res.json({ message: 'อัปเดตเรียบร้อย' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ============ GET all users ============
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        user_id, 
        name, 
        email, 
        phone, 
        address, 
        role, 
        created_at, 
        updated_at
      FROM users
      ORDER BY user_id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============ CREATE user (bcrypt) ============
router.post('/users', async (req, res) => {
  try {
    const { name, email, password = '123456', phone, address, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password, phone, address, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone || null, address || null, role || 'customer']
    );

    res.json({ message: 'เพิ่มผู้ใช้สำเร็จ', user_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เพิ่มผู้ใช้ล้มเหลว' });
  }
});

// ============ UPDATE user (bcrypt เมื่อเปลี่ยนรหัส) ============
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, phone, address, role } = req.body;

    let sql = `UPDATE users SET name=?, email=?, phone=?, address=?, role=?`;
    const params = [name, email, phone || null, address || null, role || 'customer'];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql += `, password=?`;
      params.push(hashedPassword);
    }

    sql += ` WHERE user_id=?`;
    params.push(id);

    await db.query(sql, params);
    res.json({ message: 'แก้ไขผู้ใช้สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'แก้ไขผู้ใช้ล้มเหลว' });
  }
});

// ====== Sales Dashboard Stats (REVISED) ======
const COUNT_STATUSES = ['paid', 'shipping', 'done'];
const TH_DATE = "DATE(CONVERT_TZ(created_at, '+00:00', '+07:00'))";
const TH_MONTH = "DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', '+07:00'), '%Y-%m')";

router.get('/stats/summary', async (req, res) => {
  try {
    const [todayRows] = await db.query(
      `
      SELECT 
        COALESCE(SUM(total_price),0) AS revenue, 
        COUNT(*) AS orders
      FROM orders
      WHERE status IN (?, ?, ?)
        AND ${TH_DATE} = ${TH_DATE.replace('created_at', 'NOW()')}
      `,
      COUNT_STATUSES
    );

    const [monthRows] = await db.query(
      `
      SELECT 
        COALESCE(SUM(total_price),0) AS revenue, 
        COUNT(*) AS orders
      FROM orders
      WHERE status IN (?, ?, ?)
        AND DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', '+07:00'), '%Y-%m')
            = DATE_FORMAT(CONVERT_TZ(NOW(), '+00:00', '+07:00'), '%Y-%m')
      `,
      COUNT_STATUSES
    );

    const [allRows] = await db.query(
      `
      SELECT 
        COALESCE(SUM(total_price),0) AS revenue, 
        COUNT(*) AS orders
      FROM orders
      WHERE status IN (?, ?, ?)
      `,
      COUNT_STATUSES
    );

    res.json({
      today: todayRows[0],
      month: monthRows[0],
      all: allRows[0],
    });
  } catch (err) {
    console.error('[STATS_SUMMARY]', err);
    res.status(500).json({ error: 'summary failed' });
  }
});

router.get('/stats/daily', async (req, res) => {
  const days = Math.max(1, Math.min(Number(req.query.days) || 14, 90));
  try {
    const [rows] = await db.query(
      `
      SELECT 
        ${TH_DATE} AS day,
        COUNT(*) AS orders,
        COALESCE(SUM(total_price),0) AS revenue
      FROM orders
      WHERE status IN (?, ?, ?)
        AND ${TH_DATE} >= DATE_SUB(${TH_DATE.replace('created_at', 'NOW()')}, INTERVAL ? DAY)
      GROUP BY ${TH_DATE}
      ORDER BY day DESC
      `,
      [...COUNT_STATUSES, days]
    );
    res.json(rows);
  } catch (err) {
    console.error('[STATS_DAILY]', err);
    res.status(500).json({ error: 'daily failed' });
  }
});

router.get('/stats/monthly', async (req, res) => {
  const months = Math.max(1, Math.min(Number(req.query.months) || 6, 24));
  try {
    const [rows] = await db.query(
      `
      SELECT 
        ${TH_MONTH} AS ym,
        COUNT(*) AS orders,
        COALESCE(SUM(total_price),0) AS revenue
      FROM orders
      WHERE status IN (?, ?, ?)
        AND CONVERT_TZ(created_at, '+00:00', '+07:00')
              >= DATE_SUB(DATE_FORMAT(CONVERT_TZ(NOW(), '+00:00', '+07:00'), '%Y-%m-01'), INTERVAL ?-1 MONTH)
      GROUP BY ${TH_MONTH}
      ORDER BY ym DESC
      `,
      [...COUNT_STATUSES, months]
    );
    res.json(rows);
  } catch (err) {
    console.error('[STATS_MONTHLY]', err);
    res.status(500).json({ error: 'monthly failed' });
  }
});

/* ================================
   ลบออเดอร์ (เดิม)
   ================================ */
router.delete('/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'invalid order id' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT order_id, status, created_at FROM orders WHERE order_id=? FOR UPDATE`,
      [id]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'order not found' });
    }
    const order = rows[0];

    if ((order.status || '').toLowerCase() !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ message: 'order is not pending' });
    }

    const createdMs = new Date(order.created_at).getTime();
    const diffMin = (Date.now() - createdMs) / 60000;
    if (diffMin < 20) {
      await conn.rollback();
      return res.status(400).json({ message: 'order is not older than 20 minutes' });
    }

    const [items] = await conn.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id=?`,
      [id]
    );
    for (const it of items) {
      await conn.query(
        `UPDATE products SET stock = stock + ? WHERE product_id=?`,
        [it.quantity, it.product_id]
      );
    }

    await conn.query(`DELETE FROM order_items WHERE order_id=?`, [id]);
    await conn.query(`DELETE FROM payments    WHERE order_id=?`, [id]);
    await conn.query(`DELETE FROM deliveries  WHERE order_id=?`, [id]);
    await conn.query(`DELETE FROM orders      WHERE order_id=?`, [id]);

    await conn.commit();
    return res.json({ message: 'order deleted' });
  } catch (err) {
    await conn.rollback();
    console.error('[ADMIN_DELETE_ORDER_ERROR]', err);
    return res.status(500).json({ message: 'delete failed', detail: err.message });
  } finally {
    conn.release();
  }
});

/* ==========================================
   อัปเดตสถานะชำระเงินตาม order_id (เดิม)
   ========================================== */
router.patch('/payments/by-order/:orderId', async (req, res) => {
  const orderId = Number(req.params.orderId);
  const { status } = req.body || {};
  if (!orderId) return res.status(400).json({ message: 'invalid order id' });
  if (!status)   return res.status(400).json({ message: 'missing status' });

  const allowed = new Set(['pending', 'paid', 'rejected', 'needs_review']);
  const norm = String(status).toLowerCase();
  if (!allowed.has(norm)) {
    return res.status(400).json({ message: 'invalid status' });
  }

  try {
    const [r] = await db.query(
      `UPDATE payments SET status=? WHERE order_id=?`,
      [norm, orderId]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ message: 'payment not found' });
    }
    return res.json({ message: 'payment updated' });
  } catch (err) {
    console.error('[ADMIN_UPDATE_PAYMENT_STATUS_ERROR]', err);
    return res.status(500).json({ message: 'update failed', detail: err.message });
  }
});

/* ==========================================
   NEW: Admin – categories CRUD แบบเบาๆ
   base path: /api/admin/categories
   ========================================== */

// list
router.get('/categories', async (_req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT category_id, name FROM categories ORDER BY name ASC'
    );
    res.json(rows);
  } catch (e) {
    console.error('[ADMIN_CATEGORIES_LIST]', e);
    res.status(500).json({ message: 'โหลดหมวดหมู่ล้มเหลว' });
  }
});

// create
router.post('/categories', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'กรุณาระบุชื่อหมวดหมู่' });
  try {
    const [r] = await db.query(
      'INSERT INTO categories (name) VALUES (?)',
      [name]
    );
    res.json({ message: 'เพิ่มหมวดหมู่สำเร็จ', category_id: r.insertId });
  } catch (e) {
    console.error('[ADMIN_CATEGORIES_CREATE]', e);
    res.status(500).json({ message: 'เพิ่มหมวดหมู่ล้มเหลว' });
  }
});

// update
router.put('/categories/:id', async (req, res) => {
  const { name } = req.body || {};
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'invalid id' });
  if (!name) return res.status(400).json({ message: 'กรุณาระบุชื่อหมวดหมู่' });
  try {
    await db.query('UPDATE categories SET name=? WHERE category_id=?', [name, id]);
    res.json({ message: 'แก้ไขหมวดหมู่สำเร็จ' });
  } catch (e) {
    console.error('[ADMIN_CATEGORIES_UPDATE]', e);
    res.status(500).json({ message: 'แก้ไขหมวดหมู่ล้มเหลว' });
  }
});

// delete (เซฟ ๆ: เคลียร์ category_id ใน products ให้เป็น NULL ก่อน)
router.delete('/categories/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'invalid id' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'UPDATE products SET category_id = NULL WHERE category_id = ?',
      [id]
    );
    const [r] = await conn.query(
      'DELETE FROM categories WHERE category_id = ?',
      [id]
    );

    await conn.commit();
    if (r.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่' });
    }
    res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (e) {
    await conn.rollback();
    console.error('[ADMIN_CATEGORIES_DELETE]', e);
    res.status(500).json({ message: 'ลบหมวดหมู่ล้มเหลว' });
  } finally {
    conn.release();
  }
});

module.exports = router;
