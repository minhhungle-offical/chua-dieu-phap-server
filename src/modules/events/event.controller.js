import cloudinary from '../../config/cloudinary.js'
import { generateUniqueSlug } from '../../helper/slugHelper.js'
import { STATUS_CODES } from '../../utils/httpStatusCodes.js'
import { sendError, sendSuccess } from '../../utils/response.js'
import Event from './event.model.js'

// Danh sách giá trị hợp lệ cho type (enum)
const validEventTypes = ['apc', 'retreat', 'offering', 'dharmaTalk', 'other']

// Create event
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      startDate,
      endDate,
      startTime,
      endTime,
      price,
      capacity,
      type,
    } = req.body

    if (!title || !startDate || !startTime) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Missing required fields')
    }

    if (price !== undefined && isNaN(Number(price))) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Price must be a number')
    }

    if (capacity !== undefined && (!Number.isInteger(Number(capacity)) || Number(capacity) < 0)) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Capacity must be a non-negative integer')
    }

    if (type && !validEventTypes.includes(type)) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Invalid event type')
    }

    const slug = await generateUniqueSlug(title, Event)
    const thumbnail = req.file ? { url: req.file.path, publicId: req.file.filename } : {}

    const event = await Event.create({
      title,
      description,
      shortDescription,
      startDate,
      endDate,
      startTime,
      endTime,
      price,
      capacity,
      slug,
      thumbnail,
      type,
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
      `Create event failed: ${error.message}`,
    )
  }
}

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = '',
      isActive,
      sortBy = 'createdAt',
      order = 'desc',
      startDateFrom,
      endDateTo,
      createdBy,
      slug,
      priceMin,
      priceMax,
      capacityMin,
      capacityMax,
      type,
    } = req.query

    const filter = {}

    if (search) filter.title = { $regex: search, $options: 'i' }
    if (isActive !== undefined) filter.isActive = isActive === 'true'
    if (slug) filter.slug = slug.trim().toLowerCase()
    if (createdBy) filter.createdBy = createdBy
    if (type && validEventTypes.includes(type)) filter.type = type

    if (startDateFrom) filter.startDate = { $gte: new Date(startDateFrom) }
    if (endDateTo) filter.endDate = { ...filter.endDate, $lte: new Date(endDateTo) }

    if (priceMin !== undefined || priceMax !== undefined) {
      filter.price = {}
      if (priceMin !== undefined) filter.price.$gte = Number(priceMin)
      if (priceMax !== undefined) filter.price.$lte = Number(priceMax)
    }

    if (capacityMin !== undefined || capacityMax !== undefined) {
      filter.capacity = {}
      if (capacityMin !== undefined) filter.capacity.$gte = Number(capacityMin)
      if (capacityMax !== undefined) filter.capacity.$lte = Number(capacityMax)
    }

    const allowedSortFields = [
      'createdAt',
      'startDate',
      'endDate',
      'title',
      'slug',
      'price',
      'capacity',
    ]
    if (!allowedSortFields.includes(sortBy)) sortBy = 'createdAt'

    const sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 }
    const skip = (page - 1) * limit

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Event.countDocuments(filter),
    ])

    return sendSuccess(res, 'Fetched events successfully', {
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
      `Fetch events failed: ${error.message}`,
    )
  }
}

// Get by ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email')
    if (!event) return sendError(res, STATUS_CODES.NOT_FOUND, 'Event not found')
    return sendSuccess(res, 'Fetched event successfully', event)
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Fetch event failed: ${error.message}`,
    )
  }
}

// Get by Slug
export const getEventBySlug = async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug }).populate('createdBy', 'name email')
    if (!event) return sendError(res, STATUS_CODES.NOT_FOUND, 'Event not found')
    return sendSuccess(res, 'Fetched event successfully', event)
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Fetch event failed: ${error.message}`,
    )
  }
}

// Update
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return sendError(res, STATUS_CODES.NOT_FOUND, 'Event not found')

    if (req.file) {
      if (event.thumbnail?.publicId) {
        await cloudinary.uploader.destroy(event.thumbnail.publicId)
      }
      event.thumbnail = { url: req.file.path, publicId: req.file.filename }
    }

    const allowedFields = [
      'title',
      'description',
      'shortDescription',
      'startDate',
      'endDate',
      'startTime',
      'endTime',
      'isActive',
      'price',
      'capacity',
      'type',
    ]

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'type' && !validEventTypes.includes(req.body.type)) {
          return sendError(res, STATUS_CODES.BAD_REQUEST, 'Invalid event type')
        }
        event[field] = req.body[field]
      }
    }

    if (req.body.title && req.body.title !== event.title) {
      event.slug = await generateUniqueSlug(req.body.title, Event, event._id)
    }

    await event.save()
    return sendSuccess(res, 'Event updated successfully', event)
  } catch (error) {
    return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, `Update failed: ${error.message}`)
  }
}

// Delete
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return sendError(res, STATUS_CODES.NOT_FOUND, 'Event not found')

    if (event.thumbnail?.publicId) {
      await cloudinary.uploader.destroy(event.thumbnail.publicId)
    }

    await event.deleteOne()
    return sendSuccess(res, 'Event deleted successfully')
  } catch (error) {
    return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, `Delete failed: ${error.message}`)
  }
}
