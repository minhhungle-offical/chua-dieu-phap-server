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

// Public routes - accessible without authentication
eventRouter.get('/', getAllEvents)
eventRouter.get('/:id', getEventById)
eventRouter.get('/slug/:slug', getEventBySlug)

// Create event - only admin and staff can create events
eventRouter.post(
  '/',
  authMiddleware,
  authorize(['admin', 'staff']),
  singleUpload, // handle thumbnail upload (field name: 'thumbnail')
  handleMulterError,
  createEvent,
)

// Update event - only admin and staff can update events
eventRouter.put(
  '/:id',
  authMiddleware,
  authorize(['admin', 'staff']),
  singleUpload,
  handleMulterError,
  updateEvent,
)

// Delete event - only admin can delete events
eventRouter.delete('/:id', authMiddleware, authorize(['admin']), deleteEvent)

export default eventRouter
