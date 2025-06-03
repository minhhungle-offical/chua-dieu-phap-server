import { STATUS_CODES } from '../../utils/httpStatusCodes.js'
import { sendError, sendSuccess } from '../../utils/response.js'
import cloudinary from '../../config/cloudinary.js'
import Event from './event.model.js'
import { generateUniqueSlug } from '../../helper/slugHelper.js'

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const { title, description, shortDescription, startDate, endDate, startTime, endTime } =
      req.body

    // Required fields validation
    if (!title || !startDate || !startTime) {
      return sendError(
        res,
        STATUS_CODES.BAD_REQUEST,
        'Title, start date, and start time are required',
      )
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(title, Event)

    // Handle thumbnail upload
    const thumbnail = req.file ? { url: req.file.path, publicId: req.file.filename } : {}

    const event = await Event.create({
      title,
      description,
      shortDescription,
      startDate,
      endDate,
      startTime,
      endTime,
      slug,
      thumbnail,
      createdBy: req.user._id,
    })

    return sendSuccess(res, 'Event created successfully', event, STATUS_CODES.CREATED)
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.slug) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Slug already exists')
    }
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Failed to create event: ${error.message}`,
    )
  }
}

// Get all events with filters, pagination, and sorting
export const getAllEvents = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = '',
      isActive,
      sortBy = 'createdAt',
      order = 'desc',
      startDateFrom, // filter startDate from this date (inclusive)
      endDateTo, // filter endDate up to this date (inclusive)
      createdBy,
      slug,
    } = req.query

    const filter = {}

    // filter by isActive, search, slug, createdBy
    if (isActive !== undefined) filter.isActive = isActive === 'true'
    if (search) filter.title = { $regex: search, $options: 'i' }
    if (slug) filter.slug = slug.trim().toLowerCase()
    if (createdBy) filter.createdBy = createdBy

    // filter startDate from startDateFrom onwards
    if (startDateFrom) {
      filter.startDate = { $gte: new Date(startDateFrom) }
    }

    // filter endDate up to endDateTo
    if (endDateTo) {
      filter.endDate = { $lte: new Date(endDateTo) }
    }
    const allowedSortFields = ['createdAt', 'startDate', 'endDate', 'title', 'slug']
    if (!allowedSortFields.includes(sortBy)) sortBy = 'createdAt'

    const sortOptions = {
      [sortBy]: order === 'desc' ? -1 : 1,
    }

    const skip = (page - 1) * limit

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Event.countDocuments(filter),
    ])

    return sendSuccess(res, 'Events fetched successfully', {
      data: events,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Failed to fetch events: ${error.message}`,
    )
  }
}

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email')

    if (!event) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Event not found')
    }

    return sendSuccess(res, 'Event fetched successfully', event)
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Failed to fetch event: ${error.message}`,
    )
  }
}

// Update an existing event
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Event not found')
    }

    // Handle new thumbnail upload
    if (req.file) {
      if (event.thumbnail?.publicId) {
        await cloudinary.uploader.destroy(event.thumbnail.publicId)
      }
      event.thumbnail = {
        url: req.file.path,
        publicId: req.file.filename,
      }
    }

    // Fields allowed to be updated
    const allowedFields = [
      'title',
      'description',
      'shortDescription',
      'startDate',
      'endDate',
      'startTime',
      'endTime',
      'isActive',
    ]

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field]
        event['isActive'] = true
      }
    })

    // Regenerate slug if title is changed
    if (req.body.title && req.body.title !== event.title) {
      event.slug = await generateUniqueSlug(req.body.title, Event, event._id)
    }

    await event.save()
    return sendSuccess(res, 'Event updated successfully', event)
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Failed to update event: ${error.message}`,
    )
  }
}

// Delete an event by ID
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Event not found')
    }

    // Remove associated thumbnail from Cloudinary
    if (event.thumbnail?.publicId) {
      await cloudinary.uploader.destroy(event.thumbnail.publicId)
    }

    await event.deleteOne()
    return sendSuccess(res, 'Event deleted successfully')
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Failed to delete event: ${error.message}`,
    )
  }
}
