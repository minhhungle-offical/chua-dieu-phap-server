import jwt from 'jsonwebtoken'
import User from '../modules/users/user.model.js'

// Middleware to authenticate JWT token and attach user to req.user
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ success: false, message: 'Missing or malformed token (Bearer).' })
    }

    const token = authHeader.split(' ')[1]

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' })
    }

    const user = await User.findById(decoded.id).select('-password')
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth Middleware Error:', error)
    res.status(500).json({ success: false, message: 'Server error during authentication.' })
  }
}
