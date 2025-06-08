import { STATUS_CODES } from '../../utils/httpStatusCodes.js'
import { sendError, sendSuccess } from '../../utils/response.js'
import cloudinary from '../../config/cloudinary.js'
import Event from './event.model.js'
import { generateUniqueSlug } from '../../helper/slugHelper.js'

// Tạo sự kiện mới
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
    } = req.body

    // Kiểm tra các trường bắt buộc
    if (!title || !startDate || !startTime) {
      return sendError(
        res,
        STATUS_CODES.BAD_REQUEST,
        'Vui lòng cung cấp đầy đủ: tiêu đề, ngày bắt đầu và giờ bắt đầu',
      )
    }

    // Kiểm tra giá tiền nếu có
    if (price !== undefined && isNaN(Number(price))) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Giá tiền phải là số hợp lệ')
    }
    // Kiểm tra số lượng nếu có
    if (capacity !== undefined && (!Number.isInteger(Number(capacity)) || Number(capacity) < 0)) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Số lượng phải là số nguyên không âm')
    }

    // Tạo slug duy nhất từ tiêu đề
    const slug = await generateUniqueSlug(title, Event)

    // Xử lý upload ảnh thumbnail (nếu có)
    const thumbnail = req.file ? { url: req.file.path, publicId: req.file.filename } : {}

    // Tạo bản ghi event mới trong database
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
      createdBy: req.user._id,
    })

    return sendSuccess(res, 'Tạo sự kiện thành công', event, STATUS_CODES.CREATED)
  } catch (error) {
    // Xử lý lỗi trùng slug
    if (error.code === 11000 && error.keyPattern?.slug) {
      return sendError(
        res,
        STATUS_CODES.BAD_REQUEST,
        'Slug sự kiện đã tồn tại, vui lòng đổi tên khác',
      )
    }
    // Lỗi server khác
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Tạo sự kiện thất bại: ${error.message}`,
    )
  }
}

// Lấy danh sách sự kiện với filter, phân trang, sắp xếp
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
    } = req.query

    const filter = {}

    // Lọc theo trạng thái kích hoạt
    if (isActive !== undefined) filter.isActive = isActive === 'true'
    // Lọc theo tìm kiếm tiêu đề (regex, không phân biệt hoa thường)
    if (search) filter.title = { $regex: search, $options: 'i' }
    // Lọc theo slug
    if (slug) filter.slug = slug.trim().toLowerCase()
    // Lọc theo người tạo
    if (createdBy) filter.createdBy = createdBy

    // Lọc theo ngày bắt đầu từ ngày cụ thể
    if (startDateFrom) {
      filter.startDate = { $gte: new Date(startDateFrom) }
    }
    // Lọc theo ngày kết thúc đến ngày cụ thể
    if (endDateTo) {
      filter.endDate = { $lte: new Date(endDateTo) }
    }

    // Lọc theo khoảng giá tiền nếu có
    if (priceMin !== undefined || priceMax !== undefined) {
      filter.price = {}
      if (priceMin !== undefined) filter.price.$gte = Number(priceMin)
      if (priceMax !== undefined) filter.price.$lte = Number(priceMax)
    }

    // Lọc theo khoảng số lượng nếu có
    if (capacityMin !== undefined || capacityMax !== undefined) {
      filter.capacity = {}
      if (capacityMin !== undefined) filter.capacity.$gte = Number(capacityMin)
      if (capacityMax !== undefined) filter.capacity.$lte = Number(capacityMax)
    }

    // Các trường được phép sắp xếp
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

    const sortOptions = {
      [sortBy]: order === 'desc' ? -1 : 1,
    }

    const skip = (page - 1) * limit

    // Thực hiện truy vấn lấy dữ liệu
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Event.countDocuments(filter),
    ])

    // Trả về dữ liệu cùng meta phân trang
    return sendSuccess(res, 'Lấy danh sách sự kiện thành công', {
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
      `Lấy danh sách sự kiện thất bại: ${error.message}`,
    )
  }
}

// Lấy chi tiết sự kiện theo ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email')

    if (!event) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    return sendSuccess(res, 'Lấy thông tin sự kiện thành công', event)
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Lấy thông tin sự kiện thất bại: ${error.message}`,
    )
  }
}

// Lấy chi tiết sự kiện theo slug
export const getEventBySlug = async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug }).populate('createdBy', 'name email')

    if (!event) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    return sendSuccess(res, 'Lấy thông tin sự kiện thành công', event)
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Lấy thông tin sự kiện thất bại: ${error.message}`,
    )
  }
}

// Cập nhật thông tin sự kiện
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Không tìm thấy sự kiện để cập nhật')
    }

    // Nếu có upload ảnh mới, xóa ảnh cũ trên Cloudinary rồi cập nhật
    if (req.file) {
      if (event.thumbnail?.publicId) {
        await cloudinary.uploader.destroy(event.thumbnail.publicId)
      }
      event.thumbnail = {
        url: req.file.path,
        publicId: req.file.filename,
      }
    }

    // Các trường được phép cập nhật
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
    ]

    // Gán dữ liệu mới nếu có
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field]
      }
    })

    // Nếu đổi tiêu đề, tạo lại slug mới
    if (req.body.title && req.body.title !== event.title) {
      event.slug = await generateUniqueSlug(req.body.title, Event, event._id)
    }

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

// Xóa sự kiện theo ID
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Không tìm thấy sự kiện để xóa')
    }

    // Xóa ảnh thumbnail trên Cloudinary nếu có
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
