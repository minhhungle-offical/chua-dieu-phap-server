import { config } from 'dotenv'
import nodemailer from 'nodemailer'

config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
})

export async function sendOtpEmail(email, otp) {
  try {
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
      <h2 style="color: #2c3e50;">Xác thực đăng nhập</h2>
      <p>Xin chào,</p>
      <p>Chúng tôi đã nhận được yêu cầu đăng nhập vào hệ thống. Vui lòng sử dụng mã xác thực (OTP) dưới đây để tiếp tục:</p>
      <div style="font-size: 32px; font-weight: bold; color: #1a73e8; letter-spacing: 6px; text-align: center; margin: 24px 0;">
        ${otp}
      </div>
      <p>Mã OTP này sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với quản trị viên để được hỗ trợ.</p>
      <p style="margin-top: 32px;">Trân trọng,<br/>Đội ngũ hỗ trợ</p>
    </div>
  `

    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL}>`,
      to: email,
      subject: 'Mã OTP đăng nhập',
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('OTP email sent: %s', info.messageId)
  } catch (error) {
    console.error('Error sending OTP email:', error)
  }
}
