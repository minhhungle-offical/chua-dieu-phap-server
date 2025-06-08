import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema(
  {
    // Tiêu đề sự kiện (bắt buộc, loại bỏ khoảng trắng thừa)
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
    },

    // Mô tả chi tiết sự kiện (không bắt buộc)
    description: {
      type: String,
      trim: true,
    },

    // Mô tả ngắn (tối đa 500 ký tự, không bắt buộc)
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Mô tả ngắn không được vượt quá 500 ký tự'],
    },

    // Ngày bắt đầu sự kiện (bắt buộc)
    startDate: {
      type: Date,
      required: [true, 'Ngày bắt đầu là bắt buộc'],
    },

    // Ngày kết thúc sự kiện (không bắt buộc, nếu có phải >= startDate)
    endDate: {
      type: Date,
      validate: {
        validator(value) {
          if (!value) return true // cho phép không có
          return value >= this.startDate
        },
        message: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu',
      },
    },

    // Giờ bắt đầu (bắt buộc, định dạng HH:mm hoặc HH:mm:ss)
    startTime: {
      type: String,
      trim: true,
      required: [true, 'Thời gian bắt đầu là bắt buộc'],
      validate: {
        validator(value) {
          return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value)
        },
        message: 'Thời gian bắt đầu không đúng định dạng HH:mm hoặc HH:mm:ss',
      },
    },

    // Giờ kết thúc (không bắt buộc, nếu có thì phải đúng định dạng)
    endTime: {
      type: String,
      trim: true,
      validate: {
        validator(value) {
          if (!value) return true
          return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value)
        },
        message: 'Thời gian kết thúc không đúng định dạng HH:mm hoặc HH:mm:ss',
      },
    },

    // Ảnh đại diện sự kiện: gồm URL và mã publicId trên Cloudinary
    thumbnail: {
      url: String,
      publicId: String,
    },

    // Người tạo sự kiện (bắt buộc - tham chiếu tới bảng User)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người tạo là bắt buộc'],
    },

    // Slug duy nhất cho sự kiện (bắt buộc, viết thường, loại bỏ khoảng trắng thừa)
    slug: {
      type: String,
      required: [true, 'Slug là bắt buộc'],
      trim: true,
      unique: true,
      lowercase: true,
    },

    // Danh sách người tham gia sự kiện (array các ObjectId của User)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Trạng thái kích hoạt sự kiện (mặc định: true)
    isActive: {
      type: Boolean,
      default: true,
    },

    // Số lượng người tham gia tối đa (mặc định: 0 = không giới hạn)
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Giá vé tham gia sự kiện (mặc định: 0 = miễn phí)
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt & updatedAt
    versionKey: false, // Không thêm trường __v
  },
)

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema)

export default Event
