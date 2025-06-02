import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sendOtpEmail } from '../../utils/sendOtpEmail.js'
import { generateSecureOTP } from '../../utils/generateSecureOTP.js'
import User from '../users/user.model.js'
import { STATUS_CODES } from '../../utils/httpStatusCodes.js'
import { sendError, sendSuccess } from '../../utils/response.js'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'JWT_SECRET_KEY'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

// Utility: Generate access and refresh tokens
const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role }
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

// Register new account
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, ...rest } = req.body
    if (!email || !password || !name || !phone) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Vui lòng nhập đầy đủ thông tin')
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return sendError(res, STATUS_CODES.CONFLICT, 'Email đã được sử dụng')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate OTP for email verification
    const emailVerificationOtp = generateSecureOTP()
    const emailVerificationExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Create user
    const user = await User.create({
      ...rest,
      name,
      email,
      phone,
      password: hashedPassword,
      emailVerificationOtp,
      emailVerificationExpires,
      isEmailVerified: false,
      role: 'user',
    })

    // Send OTP via email
    await sendOtpEmail(email, emailVerificationOtp)

    return sendSuccess(res, 'Đăng ký thành công. Vui lòng xác minh email.', {
      userId: user._id,
      email,
      emailVerificationOtpSent: true,
    })
  } catch (err) {
    next(err)
  }
}

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Email và mật khẩu là bắt buộc')

    // Find user
    const user = await User.findOne({ email })
    if (!user)
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Thông tin đăng nhập không chính xác')

    // Check if email is verified
    if (!user.isEmailVerified) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Vui lòng xác minh email trước')
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Thông tin đăng nhập không chính xác')

    const tokens = generateTokens(user)
    return sendSuccess(res, 'Đăng nhập thành công', { user, ...tokens })
  } catch (err) {
    next(err)
  }
}

// Refresh access token
export const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body
    if (!token) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Thiếu refresh token')
    }

    const payload = jwt.verify(token, JWT_REFRESH_SECRET)
    const user = await User.findById(payload.id)
    if (!user) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Không tìm thấy người dùng')
    }

    const tokens = generateTokens(user)
    return sendSuccess(res, 'Làm mới token thành công', tokens)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Refresh token đã hết hạn')
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Refresh token không hợp lệ')
    }
    next(err)
  }
}

// Forgot password - send OTP
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) return sendError(res, STATUS_CODES.NOT_FOUND, 'Email không tồn tại')

    // Generate OTP
    const otp = generateSecureOTP()
    user.resetPasswordOtp = otp
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000 // 5 minutes
    await user.save()

    await sendOtpEmail(email, otp)
    return sendSuccess(res, 'Mã OTP đã được gửi đến email của bạn')
  } catch (err) {
    next(err)
  }
}

// Reset password with OTP
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body
    const user = await User.findOne({ email, resetPasswordOtp: otp })
    if (!user) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'OTP hoặc email không hợp lệ')
    }

    if (Date.now() > user.resetPasswordExpires) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'OTP đã hết hạn')
    }

    user.password = await bcrypt.hash(newPassword, 10)
    user.resetPasswordOtp = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return sendSuccess(res, 'Đặt lại mật khẩu thành công')
  } catch (err) {
    next(err)
  }
}

// Verify email with OTP
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Không tìm thấy người dùng')
    }

    if (user.isEmailVerified) {
      return sendSuccess(res, 'Email đã được xác minh')
    }

    if (user.emailVerificationOtp !== otp) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'OTP không chính xác')
    }

    if (Date.now() > user.emailVerificationExpires) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'OTP đã hết hạn')
    }

    user.isEmailVerified = true
    user.emailVerificationOtp = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    return sendSuccess(res, 'Xác minh email thành công')
  } catch (err) {
    next(err)
  }
}

// Resend email verification OTP
export const resendEmailVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Email là bắt buộc')
    }

    const user = await User.findOne({ email })
    if (!user) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Không tìm thấy người dùng')
    }

    if (user.isEmailVerified) {
      return sendSuccess(res, 'Email đã được xác minh')
    }

    // Generate new OTP
    const newOtp = generateSecureOTP()
    user.emailVerificationOtp = newOtp
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

    await user.save()
    await sendOtpEmail(email, newOtp)

    return sendSuccess(res, 'Mã xác minh mới đã được gửi lại')
  } catch (err) {
    next(err)
  }
}
