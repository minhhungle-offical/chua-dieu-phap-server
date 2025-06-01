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

const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role }
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

// Đăng ký tài khoản mới
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, ...rest } = req.body
    if (!email || !password || !name || !phone) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'All fields are required')
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return sendError(res, STATUS_CODES.CONFLICT, 'Email already in use')
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10)

    // Tạo user mới với OTP email để xác minh
    const emailVerificationOtp = generateSecureOTP()
    const emailVerificationExpires = Date.now() + 10 * 60 * 1000 // 10 phút

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

    // Gửi OTP xác minh email
    await sendOtpEmail(email, emailVerificationOtp)

    return sendSuccess(res, 'Registration successful. Please verify your email.', {
      userId: user._id,
      email,
      emailVerificationOtpSent: true,
    })
  } catch (err) {
    next(err)
  }
}

// Đăng nhập
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Email and password required')

    const user = await User.findOne({ email })

    if (!user) return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Invalid credentials')

    if (!user.isEmailVerified) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Please verify your email first')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Invalid credentials')

    const tokens = generateTokens(user)
    return sendSuccess(res, 'Login successful', { user, ...tokens })
  } catch (err) {
    next(err)
  }
}

// Làm mới token
export const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body
    if (!token) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Refresh token is required')
    }

    const payload = jwt.verify(token, JWT_REFRESH_SECRET)
    const user = await User.findById(payload.id)
    if (!user) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'User not found')
    }

    const tokens = generateTokens(user)
    return sendSuccess(res, 'Token refreshed successfully', tokens)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Refresh token has expired')
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Invalid refresh token')
    }
    next(err)
  }
}

// Quên mật khẩu - gửi OTP
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) return sendError(res, STATUS_CODES.NOT_FOUND, 'Email not found')

    const otp = generateSecureOTP()
    user.resetPasswordOtp = otp
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000 // 5 phút
    await user.save()

    await sendOtpEmail(email, otp)
    return sendSuccess(res, 'OTP sent to your email')
  } catch (err) {
    next(err)
  }
}

// Đặt lại mật khẩu với OTP
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body
    const user = await User.findOne({ email, resetPasswordOtp: otp })
    if (!user) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Invalid OTP or email')
    }
    if (Date.now() > user.resetPasswordExpires) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'OTP has expired')
    }

    user.password = await bcrypt.hash(newPassword, 10)
    user.resetPasswordOtp = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return sendSuccess(res, 'Password reset successfully')
  } catch (err) {
    next(err)
  }
}

// Xác minh email với OTP
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'User not found')
    }

    if (user.isEmailVerified) {
      return sendSuccess(res, 'Email already verified')
    }

    if (user.emailVerificationOtp !== otp) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Invalid OTP')
    }

    if (Date.now() > user.emailVerificationExpires) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'OTP has expired')
    }

    user.isEmailVerified = true
    user.emailVerificationOtp = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    return sendSuccess(res, 'Email verified successfully')
  } catch (err) {
    next(err)
  }
}

export const resendEmailVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Email is required')
    }

    const user = await User.findOne({ email })
    if (!user) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'User not found')
    }

    if (user.isEmailVerified) {
      return sendSuccess(res, 'Email already verified')
    }

    // Tạo OTP mới và thời hạn mới
    const newOtp = generateSecureOTP()
    user.emailVerificationOtp = newOtp
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000 // 10 phút

    await user.save()

    await sendOtpEmail(email, newOtp)

    return sendSuccess(res, 'Verification OTP resent to your email')
  } catch (err) {
    next(err)
  }
}
