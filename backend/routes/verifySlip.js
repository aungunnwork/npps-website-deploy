const express = require('express');
const router = express.Router();
const path = require('path');
const QrReader = require('qrcode-reader');
const pool = require('../config/db');
const upload = require('../middlewares/upload');
const { verifyToken } = require('../middlewares/auth');

/* --- decodeQR เหมือนเดิม ตัดทอนเฉพาะที่ไม่เกี่ยว --- */
async function decodeQR(absPath) {
  const { default: Jimp } = await import('jimp');
  const readImage = async (p) => Jimp.read(p);
  const tryDecode = (img) =>
    new Promise((resolve, reject) => {
      const qr = new QrReader();
      qr.callback = (err, v) => (err ? reject(err) : resolve(v ? v.result : null));
      qr.decode(img.bitmap);
    });

  let img1 = await readImage(absPath);
  try {
    const W = img1.bitmap.width, H = img1.bitmap.height;
    let tw = W, th = H, maxW = 1200, maxH = 1200;
    if (W > maxW || H > maxH) { const k = Math.min(maxW/W, maxH/H); tw = Math.round(W*k); th = Math.round(H*k); }
    img1 = img1.resize({ w: tw, h: th });
    if (typeof img1.greyscale === 'function') img1.greyscale(); else if (typeof img1.grayscale === 'function') img1.grayscale();
    if (typeof img1.contrast === 'function') img1.contrast(0.5);
    if (typeof img1.normalize === 'function') img1.normalize();
  } catch (e) { console.warn('[QR_PREPROCESS_WARN:P1]', e); }

  try { const r1 = await tryDecode(img1); if (r1) return r1; } catch {}

  let img2 = await readImage(absPath);
  try {
    const W = img2.bitmap.width, H = img2.bitmap.height;
    let tw = W, th = H, maxW = 1400, maxH = 1400;
    if (W < 600 && H < 600) { const k = Math.min(maxW/W, maxH/H); tw = Math.round(W*k); th = Math.round(H*k); }
    else if (W > maxW || H > maxH) { const k = Math.min(maxW/W, maxH/H); tw = Math.round(W*k); th = Math.round(H*k); }
    img2 = img2.resize({ w: tw, h: th });
    if (typeof img2.greyscale === 'function') img2.greyscale(); else if (typeof img2.grayscale === 'function') img2.grayscale();
    if (typeof img2.invert === 'function') img2.invert();
    if (typeof img2.contrast === 'function') img2.contrast(0.8);
    if (typeof img2.normalize === 'function') img2.normalize();
  } catch (e) { console.warn('[QR_PREPROCESS_WARN:P2]', e); }

  try { const r2 = await tryDecode(img2); if (r2) return r2; } catch {}
  return null;
}

/* --- กลาง --- */
async function handleVerify(req, res, orderId) {
  const uid = req.user.uid;
  if (!orderId) return res.status(400).json({ message: 'missing order_id' });
  if (!req.file) return res.status(400).json({ message: 'missing slip file' });

  const fileName = req.file.filename;
  const slipUrl  = `/uploads/slips/${fileName}`;
  const slipAbs  = path.join(__dirname, '..', 'uploads', 'slips', fileName);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT p.amount_expected, p.bill_ref, p.status, o.user_id
         FROM payments p
         JOIN orders   o ON p.order_id = o.order_id
        WHERE p.order_id = ?
        LIMIT 1`,
      [orderId]
    );
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ message: 'ไม่พบข้อมูลการชำระเงินของออเดอร์นี้' }); }
    const pay = rows[0];
    if (pay.user_id !== uid) { await conn.rollback(); return res.status(403).json({ message: 'ไม่มีสิทธิ์ยืนยันสลิปของออเดอร์นี้' }); }

    let decoded = null;
    try { decoded = await decodeQR(slipAbs); if (decoded) console.log('[DECODED_QR]', decoded); } catch (e) { console.warn('WARN decodeQR ->', e); }

    const genericOk = async () => {
      // บันทึกไฟล์ + ตั้ง needs_review ให้แอดมินตรวจ
      await conn.query(
        `UPDATE payments
            SET payment_slip_url=?, status='needs_review'
          WHERE order_id=?`,
        [slipUrl, orderId]
      );
      await conn.commit();
      // ตอบกลาง ๆ เสมอ
      return res.json({
        message: 'อัปโหลดสลิปเรียบร้อย ระบบจะตรวจสอบและดำเนินการต่อ',
        order_id: orderId,
        slip_url: slipUrl
      });
    };

    // ถ้าอ่าน QR ไม่ได้ -> ให้ตรวจทานภายหลัง
    if (!decoded) return genericOk();

    // ตรวจความสอดคล้องแบบ "นิ่ม" ถ้าไม่ผ่านก็เข้าช่องตรวจทาน
    const shopPP = (process.env.PROMPTPAY_ID || '').replace(/\D/g, '');
    if (shopPP && !decoded.includes(shopPP)) return genericOk();
    if (pay.bill_ref && !decoded.includes(pay.bill_ref)) return genericOk();

    // ตรวจยอด (ถ้าเจอใน payload)
    let slipAmount = null;
    const m = decoded.match(/(\d+\.\d{2})/);
    if (m) slipAmount = parseFloat(m[1]);
    const expected = parseFloat(pay.amount_expected || 0);
    if (Number.isFinite(slipAmount) && Math.abs(slipAmount - expected) > 0.01) {
      return genericOk();
    }

    // ✅ ผ่านทุกเงื่อนไข -> mark paid
    await conn.query(
      `UPDATE payments
          SET payment_slip_url=?, status='paid', paid_at=NOW()
        WHERE order_id=?`,
      [slipUrl, orderId]
    );
    await conn.query(
      `UPDATE orders SET status='paid' WHERE order_id=?`,
      [orderId]
    );

    await conn.commit();
    return res.json({
      message: 'ชำระเงินสำเร็จ',
      order_id: orderId,
      slip_url: slipUrl,
      decoded_amount: Number.isFinite(slipAmount) ? slipAmount : null,
      expected_amount: expected
    });
  } catch (err) {
    await conn.rollback();
    console.error('[VERIFY_SLIP_ERROR]', err);
    return res.status(500).json({ message: 'verify error', detail: err.message });
  } finally {
    conn.release();
  }
}

router.post('/verify-slip/:orderId', verifyToken, upload.single('slip'),
  async (req, res) => handleVerify(req, res, Number(req.params.orderId)));
router.post('/verify-slip', verifyToken, upload.single('slip'),
  async (req, res) => handleVerify(req, res, Number(req.query.order_id)));

module.exports = router;
