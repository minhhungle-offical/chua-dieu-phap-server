import express from 'express'
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from './event.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/authorize.middleware.js'
import { singleUpload } from '../../middleware/upload.js'
import { handleMulterError } from '../../middleware/handleMulterError.js'

const eventRouter = express.Router()

// Public routes - accessible without authentication
eventRouter.get('/', getAllEvents)
eventRouter.get('/:id', getEventById)

// Apply authentication middleware for all routes below
eventRouter.use(authMiddleware)

// Create event - only admin and staff can create events
eventRouter.post(
  '/',
  authorize(['admin', 'staff']),
  singleUpload, // handle thumbnail upload (field name: 'thumbnail')
  handleMulterError,
  createEvent,
)

// Update event - only admin and staff can update events
eventRouter.put('/:id', authorize(['admin', 'staff']), singleUpload, handleMulterError, updateEvent)

// Delete event - only admin can delete events
eventRouter.delete('/:id', authorize(['admin']), deleteEvent)

export default eventRouter
