import bcrypt from 'bcrypt'
import User from './user.model.js'
import { STATUS_CODES } from '../../utils/httpStatusCodes.js'
import { sendSuccess, sendError } from '../../utils/response.js'

// Utility to remove sensitive fields like password
const sanitizeUser = (user) => {
  const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user }
  delete userObj.password
  return userObj
}

// GET /users - Get paginated, searchable, and sortable list of users
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc' } = req.query

    const filter = search.trim()
      ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
      : {}

    const sort = { [sortBy]: order === 'asc' ? 1 : -1 }
    const skip = (Number(page) - 1) * Number(limit)

    const [users, totalCount] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ])

    const totalPages = Math.ceil(totalCount / Number(limit))

    return sendSuccess(res, 'Users retrieved successfully', {
      items: users.map(sanitizeUser),
      meta: {
        totalCount,
        currentPage: Number(page),
        pageSize: Number(limit),
        totalPages,
        hasNextPage: Number(page) < totalPages,
        hasPreviousPage: Number(page) > 1,
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /users/:id - Get user by ID
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean()
    if (!user) return sendError(res, STATUS_CODES.NOT_FOUND, 'User not found')

    return sendSuccess(res, 'User retrieved successfully', user)
  } catch (err) {
    next(err)
  }
}

// POST /users - Create new user
export const createUser = async (req, res, next) => {
  try {
    const { name, email, phone, role = 'user', ...rest } = req.body

    if (!name || !email || !phone) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Name, email, and phone are required')
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return sendError(res, STATUS_CODES.CONFLICT, 'Email already in use')
    }

    const newUser = new User({
      name,
      email,
      phone,
      role,
      ...rest,
    })

    await newUser.save()

    return sendSuccess(res, 'User created successfully', sanitizeUser(newUser))
  } catch (err) {
    next(err)
  }
}

// PUT /users/:id - Update user info (excluding password)
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return sendError(res, STATUS_CODES.NOT_FOUND, 'User not found')

    const { password, ...updates } = req.body
    Object.assign(user, updates)

    const updatedUser = await user.save()
    return sendSuccess(res, 'User updated successfully', sanitizeUser(updatedUser))
  } catch (err) {
    next(err)
  }
}

// DELETE /users/:id - Delete user by ID
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return sendError(res, STATUS_CODES.NOT_FOUND, 'User not found')

    await user.deleteOne()
    return sendSuccess(res, 'User deleted successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /users/:id/change-password - Change password with old password verification
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Old and new passwords are required')
    }

    const user = await User.findById(req.params.id)
    if (!user) return sendError(res, STATUS_CODES.NOT_FOUND, 'User not found')

    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Old password is incorrect')
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    return sendSuccess(res, 'Password changed successfully')
  } catch (err) {
    next(err)
  }
}

// GET /users/profile - Get current user's profile
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id
    if (!userId) return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Unauthorized')

    const user = await User.findById(userId).select('-password').lean()
    if (!user) return sendError(res, STATUS_CODES.NOT_FOUND, 'User not found')

    return sendSuccess(res, 'Profile retrieved successfully', user)
  } catch (err) {
    next(err)
  }
}

// PUT /users/profile - Update current user's profile
export const updateProfile = async (req, res, next) => {
  try {
    const user = req.user
    if (!user) return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Unauthorized')

    const { password, ...updates } = req.body
    Object.assign(user, updates)

    const updated = await user.save()
    return sendSuccess(res, 'Profile updated successfully', sanitizeUser(updated))
  } catch (err) {
    next(err)
  }
}

// PUT /users/profile/avatar - Upload or update user's avatar
export const uploadAvatar = async (req, res, next) => {
  try {
    const user = req.user
    if (!user) return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Unauthorized')

    if (!req.file?.path) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'No file uploaded')
    }

    user.avatar = req.file.path
    await user.save()

    return sendSuccess(res, 'Avatar uploaded successfully', { avatar: user.avatar })
  } catch (err) {
    next(err)
  }
}
