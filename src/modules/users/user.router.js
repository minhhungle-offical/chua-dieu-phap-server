import express from 'express'
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  getProfile,
  updateProfile,
  uploadAvatar,
} from './user.controller.js'
import { singleUpload } from '../../middleware/upload.js'
import { authorize } from '../../middleware/authorize.middleware.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { handleMulterError } from '../../middleware/handleMulterError.js'

const userRouter = express.Router()

// Apply auth to all routes
userRouter.use(authMiddleware)

// Authenticated user: Get own profile
userRouter.get('/profile', authMiddleware, authorize(['admin', 'staff', 'user']), getProfile)

// Authenticated user: Update own profile
userRouter.put('/profile', authorize(['admin', 'staff', 'user']), updateProfile)

// Authenticated user: Upload or update avatar
userRouter.put(
  '/profile/avatar',
  authorize(['admin', 'staff', 'user']),
  singleUpload,
  handleMulterError,
  uploadAvatar,
)

// User: Change own password
userRouter.put('/:id/change-password', authorize(['admin', 'staff', 'user']), changePassword)

// Admin: Retrieve all users (with pagination, search, sorting)
userRouter.get('/', authorize(['admin']), getUsers)

// Admin: Create a new user
userRouter.post('/', authorize(['admin']), createUser)

// Admin/staff/user: Get user by ID
userRouter.get('/:id', authorize(['admin', 'staff', 'user']), getUserById)

// Admin/staff/user: Update user by ID
userRouter.put('/:id', authorize(['admin', 'staff', 'user']), updateUser)

// Admin: Delete user by ID
userRouter.delete('/:id', authorize(['admin']), deleteUser)

export default userRouter
