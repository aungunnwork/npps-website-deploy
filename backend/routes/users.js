// backend/routes/users.js
const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const { verifyToken } = require('../middlewares/auth')

// GET /api/users/me
router.get('/me', verifyToken, async (req, res) => {
  const uid = req.user.uid
  try {
    const [rows] = await pool.query(
      'SELECT user_id, name, phone, address, email FROM users WHERE user_id=?',
      [uid]
    )
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบ user' })
    res.json(rows[0])
  } catch (e) {
    console.error('[USERS_ME_ERROR]', e)
    res.status(500).json({ message: 'โหลดข้อมูล user ไม่สำเร็จ', detail: e.message })
  }
})

// ✅ PATCH /api/users/me
router.patch('/me', verifyToken, async (req, res) => {
  const uid = req.user.uid
  const { phone, address } = req.body

  try {
    await pool.query(
      'UPDATE users SET phone=?, address=? WHERE user_id=?',
      [phone || null, address || null, uid]
    )
    res.json({ ok: true })
  } catch (e) {
    console.error('[USERS_UPDATE_ERROR]', e)
    res.status(500).json({ message: 'อัปเดต user ไม่สำเร็จ', detail: e.message })
  }
})

module.exports = router
