import { generateSecureOTP } from '../../utils/generateSecureOTP.js'
import { sendOtpEmail } from '../../utils/sendOtpEmail.js'
import { sendQrEmail } from '../../utils/sendQREmail.js'
import Event from '../events/event.model.js'
import Participant from './participants.model.js'

/**
 * Tạo mới participant (người tham gia sự kiện).
 * - Yêu cầu: name, event, hasAgreed
 * - Nếu chọn borrow/buy robe thì yêu cầu robeSize
 * - Nếu có email → tạo OTP, gửi email xác thực
 * - Nếu không có email → tạo participant ở trạng thái pending chờ duyệt
 */
export const createParticipant = async (req, res) => {
  try {
    const data = req.body

    // 1. Kiểm tra dữ liệu bắt buộc
    if (!data.name || !data.event) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tên và sự kiện.' })
    }

    if (['borrow', 'buy'].includes(data.robeOption) && !data.robeSize) {
      return res
        .status(400)
        .json({ message: 'Vui lòng chọn kích cỡ áo nếu mượn hoặc mua áo tràng.' })
    } else if (!['borrow', 'buy'].includes(data.robeOption)) {
      data.robeSize = null
    }

    // 2. Kiểm tra sự kiện có tồn tại không
    const selectedEvent = await Event.findById(data.event)
    if (!selectedEvent) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện.' })
    }

    // 3. Kiểm tra số lượng participant chưa vượt quá giới hạn
    const currentCount = await Participant.countDocuments({
      event: data.event,
      isActive: true,
      status: { $in: ['pending', 'confirmed'] },
    })

    if (selectedEvent.capacity && currentCount >= selectedEvent.capacity) {
      return res.status(400).json({ message: 'Sự kiện đã đủ số lượng người tham gia.' })
    }

    // 4. Kiểm tra người này đã từng tham gia sự kiện khác chưa
    let hasParticipatedBefore = false
    if (data.email || data.phoneNumber) {
      const existed = await Participant.findOne({
        $or: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
        event: { $ne: data.event },
        isActive: true,
      })
      hasParticipatedBefore = !!existed
    }
    data.isFirstTime = !hasParticipatedBefore

    // 5. Kiểm tra đồng ý tham gia
    if (!data.hasAgreed) {
      return res.status(400).json({ message: 'Bạn cần đồng ý tham gia sự kiện.' })
    }

    data.status = 'pending'

    // 6. Nếu có email → tạo OTP + gửi email xác thực
    if (data.email) {
      const otp = generateSecureOTP(6)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 phút
      data.otp = otp
      data.expiresAt = expiresAt

      const participant = await Participant.create(data)
      await sendOtpEmail(data.email, otp)

      return res.status(200).json({
        message: 'Đăng ký thành công! Mã OTP đã được gửi vào email.',
        participantId: participant._id,
      })
    }

    // 7. Nếu không có email → participant ở trạng thái pending chờ duyệt
    data.otp = null
    data.expiresAt = null
    const participant = await Participant.create(data)

    return res.status(201).json({
      message: 'Đăng ký thành công! Vui lòng chờ ban tổ chức duyệt.',
      participant,
    })
  } catch (error) {
    console.error('Lỗi tạo participant:', error)
    return res.status(500).json({ message: 'Lỗi server.', error: error.message })
  }
}

/**
 * Xác thực OTP được gửi qua email.
 * - Kiểm tra OTP đúng và còn hạn không
 * - Nếu sự kiện có phí thì không xác nhận, chỉ đánh dấu đã xác thực email
 * - Nếu vượt quá số lượng → không xác nhận
 * - Nếu hợp lệ → xác nhận và gửi QR code qua email
 */
export const verifyOtp = async (req, res) => {
  try {
    const { participantId, otpInput } = req.body

    if (!participantId || !otpInput) {
      return res.status(400).json({ message: 'Thiếu participantId hoặc mã OTP.' })
    }

    const participant = await Participant.findById(participantId).populate('event')
    if (!participant) {
      return res.status(404).json({ message: 'Không tìm thấy người tham gia.' })
    }

    const event = participant.event
    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện liên quan.' })
    }

    // Kiểm tra OTP hợp lệ
    if (!participant.otp || !participant.expiresAt) {
      return res.status(400).json({ message: 'Không có mã OTP hợp lệ.' })
    }

    if (participant.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn.' })
    }

    if (participant.otp !== otpInput) {
      return res.status(400).json({ message: 'Mã OTP không đúng.' })
    }

    // Nếu sự kiện có phí → không cho xác nhận (chờ thanh toán)
    if (event.price > 0) {
      participant.isEmailVerified = true
      participant.otp = null
      participant.expiresAt = null
      await participant.save()

      return res.status(200).json({
        message: 'Xác thực email thành công. Vui lòng thanh toán để hoàn tất đăng ký.',
        participant,
      })
    }

    // Kiểm tra nếu đã đủ người tham gia
    const confirmedCount = await Participant.countDocuments({
      event: event._id,
      status: 'confirmed',
      isActive: true,
    })

    if (event.maxParticipants && confirmedCount >= event.maxParticipants) {
      return res.status(400).json({
        message: 'Sự kiện đã đủ người tham gia. Rất tiếc bạn không thể đăng ký thêm.',
      })
    }

    // Tất cả hợp lệ → xác nhận thành công
    participant.status = 'confirmed'
    participant.isEmailVerified = true
    participant.otp = null
    participant.expiresAt = null
    await participant.save()

    if (participant.email) {
      await sendQrEmail(participant.email, participant)
    }

    return res.status(200).json({
      message: 'Xác thực thành công. Bạn đã đăng ký tham gia sự kiện.',
      participant,
    })
  } catch (error) {
    console.error('Lỗi xác thực OTP:', error)
    return res.status(500).json({ message: 'Lỗi server.', error: error.message })
  }
}

/**
 * Admin duyệt participant (dành cho participant không có email hoặc sự kiện có phí).
 * - Cập nhật status = confirmed, xóa OTP nếu có
 * - Gửi QR code nếu có email
 */
export const approveParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const participant = await Participant.findById(id)
    if (!participant) {
      return res.status(404).json({ message: 'Không tìm thấy participant.' })
    }

    participant.status = 'confirmed'
    participant.otp = null
    participant.expiresAt = null
    await participant.save()

    if (participant.email) {
      await sendQrEmail(participant.email, participant)
    }

    return res.json({ message: 'Duyệt participant thành công.', participant })
  } catch (error) {
    console.error('Lỗi duyệt participant:', error)
    return res.status(500).json({ message: 'Lỗi server.', error: error.message })
  }
}

/**
 * Check-in participant khi đến sự kiện
 * - Đánh dấu isCheckedIn = true và lưu thời gian check-in
 */
export const checkInParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const participant = await Participant.findByIdAndUpdate(
      id,
      { isCheckedIn: true, checkedInAt: new Date() },
      { new: true },
    )

    if (!participant) {
      return res.status(404).json({ message: 'Không tìm thấy participant.' })
    }

    return res.json({ message: 'Check-in thành công.', participant })
  } catch (error) {
    console.error('Lỗi check-in participant:', error)
    return res.status(500).json({ message: 'Lỗi server.', error: error.message })
  }
}

/**
 * Cập nhật thông tin participant
 * - Nếu đổi email thì reset status về pending
 */
export const updateParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body

    const participant = await Participant.findById(id)
    if (!participant) {
      return res.status(404).json({ message: 'Không tìm thấy participant.' })
    }

    if (data.email && data.email !== participant.email) {
      data.status = 'pending'
    }

    const updated = await Participant.findByIdAndUpdate(id, data, { new: true })
    return res.json({ message: 'Cập nhật thành công.', participant: updated })
  } catch (error) {
    console.error('Lỗi cập nhật participant:', error)
    return res.status(500).json({ message: 'Lỗi server.', error: error.message })
  }
}

/**
 * Xóa mềm participant (không xóa khỏi DB)
 * - Đặt isActive = false
 */
export const deleteParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const participant = await Participant.findByIdAndUpdate(id, { isActive: false }, { new: true })
    if (!participant) {
      return res.status(404).json({ message: 'Không tìm thấy participant.' })
    }
    return res.json({ message: 'Đã xóa participant thành công.' })
  } catch (error) {
    console.error('Lỗi xóa participant:', error)
    return res.status(500).json({ message: 'Lỗi server.', error: error.message })
  }
}

/**
 * Khôi phục participant đã bị xóa mềm
 * - Đặt isActive = true
 */
export const activateParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const participant = await Participant.findByIdAndUpdate(id, { isActive: true }, { new: true })
    if (!participant) {
      return res.status(404).json({ message: 'Không tìm thấy participant.' })
    }
    return res.json({ message: 'Kích hoạt participant thành công.', participant })
  } catch (error) {
    console.error('Lỗi kích hoạt participant:', error)
    return res.status(500).json({ message: 'Lỗi server.', error: error.message })
  }
}

/**
 * Lấy danh sách participant theo điều kiện lọc (event, status), có phân trang
 * - Trả về dữ liệu + meta: tổng số, trang, limit
 */
export const getParticipants = async (req, res) => {
  try {
    const { event, status, page = 1, limit = 10 } = req.query
    const query = { isActive: true }
    if (event) query.event = event
    if (status) query.status = status

    const skip = (page - 1) * limit
    const total = await Participant.countDocuments(query)
    const data = await Participant.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate('event', 'name date')

    return res.json({ meta: { total, page: Number(page), limit: Number(limit) }, data })
  } catch (error) {
    console.error('Lỗi lấy danh sách participant:', error)
    return res.status(500).json({ message: 'Lỗi server.', error: error.message })
  }
}

/**
 * Lấy chi tiết participant theo ID, có populated event
 */
export const getParticipantById = async (req, res) => {
  try {
    const { id } = req.params
    const participant = await Participant.findById(id).populate('event', 'name date')
    if (!participant) {
      return res.status(404).json({ message: 'Không tìm thấy participant.' })
    }
    return res.json(participant)
  } catch (error) {
    console.error('Lỗi lấy chi tiết participant:', error)
    return res.status(500).json({ message: 'Lỗi server.', error: error.message })
  }
}
