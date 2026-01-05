const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

function verifyToken(req, res, next) {
  const hdr = req.headers.authorization || ''
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null
  if (!token) return res.status(401).json({ message: 'missing token' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    // normalize ให้มี uid เสมอ
    req.user = {
      uid: decoded.uid || decoded.user_id || decoded.id,
      role: decoded.role || 'customer',
      iat: decoded.iat,
      exp: decoded.exp
    }

    if (!req.user.uid) {
      return res.status(400).json({ message: 'token missing uid/user_id' })
    }

    next()
  } catch (e) {
    console.error('[verifyToken error]', e)
    return res.status(401).json({ message: 'invalid/expired token' })
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'forbidden' })
  }
  next()
}

module.exports = { verifyToken, adminOnly }
