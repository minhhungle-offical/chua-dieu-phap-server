import { STATUS_CODES } from '../../utils/httpStatusCodes.js'
import { sendError, sendSuccess } from '../../utils/response.js'
import cloudinary from '../config/cloudinary.js'
import Event from '../models/event.model.js'

/**
 * Create a new event
 * POST /api/events
 * Private access
 */
export const createEvent = async (req, res) => {
  try {
    const { title, description, shortDescription, startDate, endDate, startTime, endTime, slug } =
      req.body

    // Validate required fields
    if (!title || !startDate || !slug || !startTime) {
      return sendError(
        res,
        STATUS_CODES.BAD_REQUEST,
        'Tiêu đề, ngày bắt đầu, thời gian bắt đầu và slug là bắt buộc',
      )
    }

    const thumbnail = req.file
      ? {
          url: req.file.path,
          publicId: req.file.filename,
        }
      : {}

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

    return sendSuccess(res, 'Tạo sự kiện thành công', event, STATUS_CODES.CREATED)
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.slug) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Slug đã tồn tại, vui lòng chọn slug khác')
    }

    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Tạo sự kiện thất bại: ${error.message}`,
    )
  }
}

/**
 * Get all events with filters, pagination, and sorting
 * GET /api/events
 * Public access
 */
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
      startDateTo,
      createdBy,
      participant,
      slug,
    } = req.query

    page = Number(page)
    limit = Number(limit)

    const filter = {}

    if (isActive !== undefined) filter.isActive = isActive === 'true'
    if (search) filter.title = { $regex: search, $options: 'i' }
    if (slug) filter.slug = slug.trim().toLowerCase()
    if (createdBy) filter.createdBy = createdBy
    if (participant) filter.participants = participant

    if (startDateFrom || startDateTo) {
      filter.startDate = {}
      if (startDateFrom) filter.startDate.$gte = new Date(startDateFrom)
      if (startDateTo) filter.startDate.$lte = new Date(startDateTo)
    }

    const allowedSortFields = ['createdAt', 'startDate', 'endDate', 'title', 'slug']
    if (!allowedSortFields.includes(sortBy)) sortBy = 'createdAt'

    const sortOrder = order === 'desc' ? -1 : 1
    const sortOptions = { [sortBy]: sortOrder }

    const skip = (page - 1) * limit

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter),
    ])

    return sendSuccess(res, 'Lấy danh sách sự kiện thành công', {
      events,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Lấy danh sách sự kiện thất bại: ${error.message}`,
    )
  }
}

/**
 * Get event by ID
 * GET /api/events/:id
 * Public access
 */
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email')

    if (!event) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    return sendSuccess(res, 'Lấy sự kiện thành công', event)
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Lấy sự kiện thất bại: ${error.message}`,
    )
  }
}

/**
 * Update an event by ID
 * PUT /api/events/:id
 * Private access
 */
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    if (req.file) {
      if (event.thumbnail?.publicId) {
        await cloudinary.uploader.destroy(event.thumbnail.publicId)
      }
      event.thumbnail = {
        url: req.file.path,
        publicId: req.file.filename,
      }
    }

    Object.assign(event, req.body)
    await event.save()

    return sendSuccess(res, 'Cập nhật sự kiện thành công', event)
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Cập nhật sự kiện thất bại: ${error.message}`,
    )
  }
}

/**
 * Delete an event by ID
 * DELETE /api/events/:id
 * Private access
 */
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    if (event.thumbnail?.publicId) {
      await cloudinary.uploader.destroy(event.thumbnail.publicId)
    }

    await event.deleteOne()

    return sendSuccess(res, 'Xóa sự kiện thành công')
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Xóa sự kiện thất bại: ${error.message}`,
    )
  }
}
