import express from 'express'
import {
  activateParticipant,
  approveParticipant,
  checkInParticipant,
  createParticipant,
  deleteParticipant,
  getParticipantById,
  getParticipants,
  updateParticipant,
  verifyOtp,
} from './participant.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/authorize.middleware.js'

const participantRoutes = express.Router()

// Tạo mới participant (có/không email)
participantRoutes.post('/', createParticipant)

// Xác thực OTP
participantRoutes.post('/verify-otp', verifyOtp)

// Admin duyệt participant
participantRoutes.patch(
  '/:id/approve',
  authMiddleware,
  authorize(['admin,staff']),
  approveParticipant,
)

// Check-in participant
participantRoutes.patch(
  '/:id/check-in',
  authMiddleware,
  authorize(['admin,staff']),
  checkInParticipant,
)

// Cập nhật thông tin participant
participantRoutes.put('/:id', authMiddleware, authorize(['admin,staff']), updateParticipant)

// Xóa mềm participant
participantRoutes.delete('/:id', authMiddleware, authorize(['admin,staff']), deleteParticipant)

// Kích hoạt lại participant đã xóa
participantRoutes.patch(
  '/:id/activate',
  authMiddleware,
  authorize(['admin,staff']),
  activateParticipant,
)

// Lấy danh sách participants (lọc, phân trang)
participantRoutes.get('/', authMiddleware, authorize(['admin,staff']), getParticipants)

// Lấy chi tiết participant theo ID
participantRoutes.get('/:id', authMiddleware, authorize(['admin,staff']), getParticipantById)

export default participantRoutes
