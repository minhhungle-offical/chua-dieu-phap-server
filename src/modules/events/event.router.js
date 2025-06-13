import express from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/authorize.middleware.js'
import { handleMulterError } from '../../middleware/handleMulterError.js'
import { singleUpload } from '../../middleware/upload.js'
import {
  createEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
  getEventBySlug,
  updateEvent,
} from './event.controller.js'

const eventRouter = express.Router()

// 🔓 Public routes
eventRouter.get('/', getAllEvents) // List all events
eventRouter.get('/slug/:slug', getEventBySlug) // Get event by slug (must come before /:id)
eventRouter.get('/:id', getEventById) // Get event by ID

// 🔐 Protected routes - Admin & Staff
eventRouter.post(
  '/',
  authMiddleware,
  authorize(['admin', 'staff']),
  singleUpload, // expects req.file from field 'thumbnail'
  handleMulterError,
  createEvent,
)

eventRouter.put(
  '/:id',
  authMiddleware,
  authorize(['admin', 'staff']),
  singleUpload,
  handleMulterError,
  updateEvent,
)

// 🔐 Delete route - Only Admin
eventRouter.delete('/:id', authMiddleware, authorize(['admin']), deleteEvent)

export default eventRouter
