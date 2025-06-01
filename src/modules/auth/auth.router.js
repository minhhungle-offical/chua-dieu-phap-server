import express from 'express'
import {
  forgotPassword,
  login,
  refreshToken,
  register,
  resendEmailVerificationOtp,
  resetPassword,
  verifyEmail,
} from './auth.controller.js'

const authRouter = express.Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/refresh-token', refreshToken)

authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)

authRouter.post('/verify-email', verifyEmail)
authRouter.post('/resend-verification-otp', resendEmailVerificationOtp)

export default authRouter
