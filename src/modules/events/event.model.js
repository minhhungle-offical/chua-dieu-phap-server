import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema(
  {
    // Event title: required, trimmed string
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
    },

    // Full description: optional, trimmed string
    description: {
      type: String,
      trim: true,
    },

    // Short description: optional, max length 200 characters, trimmed
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'Mô tả ngắn không được vượt quá 200 ký tự'],
    },

    // Event start date: required date
    startDate: {
      type: Date,
      required: [true, 'Ngày bắt đầu là bắt buộc'],
    },

    // Event end date: optional date, must be >= startDate if provided
    endDate: {
      type: Date,
      validate: {
        validator(value) {
          if (!value) return true // allow empty endDate
          return value >= this.startDate
        },
        message: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu',
      },
    },

    // Event start time: required string, validated as HH:mm or HH:mm:ss format
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

    // Event end time: optional string, validated as HH:mm or HH:mm:ss format
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

    // Thumbnail image info stored as URL and Cloudinary public ID
    thumbnail: {
      url: String,
      publicId: String,
    },

    // Reference to User who created the event (required)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người tạo là bắt buộc'],
    },

    // Unique slug string: required, trimmed, lowercase
    slug: {
      type: String,
      required: [true, 'Slug là bắt buộc'],
      trim: true,
      unique: true,
      lowercase: true,
    },

    // Array of participants (User references)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Active flag for the event (default: true)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Auto add createdAt, updatedAt
    versionKey: false, // Disable __v field
  },
)

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema)

export default Event
