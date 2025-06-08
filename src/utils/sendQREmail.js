import QRCode from 'qrcode'

export async function sendQrEmail(email, participantInfo) {
  try {
    // Nội dung QR code (có thể là participant._id hoặc mã check-in riêng)
    const qrData = `CHECKIN:${participantInfo._id}`

    // Tạo QR code dạng Data URL (base64)
    const qrImageUrl = await QRCode.toDataURL(qrData)

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
        <h2 style="color: #2c3e50;">Mã QR Tham Dự Sự Kiện</h2>
        <p>Xin chào <strong>${participantInfo.name}</strong>,</p>
        <p>Bạn đã đăng ký tham dự sự kiện thành công. Vui lòng sử dụng mã QR bên dưới để điểm danh khi đến sự kiện.</p>
        <div style="text-align: center; margin: 24px 0;">
          <img src="${qrImageUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
        </div>
        <p>Hãy giữ email này để sử dụng khi check-in.</p>
        <p style="margin-top: 32px;">Trân trọng,<br/>Ban tổ chức</p>
      </div>
    `

    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL}>`,
      to: email,
      subject: 'Mã QR Tham Dự Sự Kiện',
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('QR email sent: %s', info.messageId)
  } catch (error) {
    console.error('Error sending QR email:', error)
  }
}
