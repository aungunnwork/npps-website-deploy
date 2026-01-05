// backend/routes/uploads.js
const express = require('express')
const multer = require('multer')
const path = require('path')
const router = express.Router()

// ตั้งค่าโฟลเดอร์เก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/products'))
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, unique + path.extname(file.originalname))
  }
})
const upload = multer({ storage })

// อัปโหลดรูปสินค้า
router.post('/product', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }
  const fileUrl = `/uploads/products/${req.file.filename}`
  res.json({ url: fileUrl }) // ✅ ส่งกลับลิงก์ไปให้ frontend เอาไปเซฟใน DB
})

module.exports = router
