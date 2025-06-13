import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema(
  {
    // Event title (required, trims excess whitespace)
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    // Full event description (optional)
    description: {
      type: String,
      trim: true,
    },

    // Short description (max 500 characters, optional)
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description must not exceed 500 characters'],
    },

    // Start date (required)
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    // End date (optional, must be >= startDate if provided)
    endDate: {
      type: Date,
      validate: {
        validator(value) {
          if (!value) return true
          return value >= this.startDate
        },
        message: 'End date must be greater than or equal to start date',
      },
    },

    // Start time (required, format: HH:mm or HH:mm:ss)
    startTime: {
      type: String,
      trim: true,
      required: [true, 'Start time is required'],
      validate: {
        validator(value) {
          return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value)
        },
        message: 'Start time must be in the format HH:mm or HH:mm:ss',
      },
    },

    // End time (optional, must be valid time format if provided)
    endTime: {
      type: String,
      trim: true,
      validate: {
        validator(value) {
          if (!value) return true
          return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value)
        },
        message: 'End time must be in the format HH:mm or HH:mm:ss',
      },
    },

    // Event thumbnail (Cloudinary URL & publicId)
    thumbnail: {
      url: String,
      publicId: String,
    },

    // Created by (reference to User model)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'CreatedBy is required'],
    },

    // Unique slug (lowercase, trimmed)
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      unique: true,
      lowercase: true,
    },

    // Whether the event is active (default: true)
    isActive: {
      type: Boolean,
      default: true,
    },

    // Maximum number of participants (0 = unlimited)
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Ticket price (0 = free)
    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Event type (enum used to classify the event)
    // - apc: Summer Rains Retreat (An Cư Kiết Hạ)
    // - retreat: Meditation or mindfulness retreat (Khóa tu thiền hoặc chánh niệm)
    // - offering: Donation or offering ceremony ( Lễ cúng dường hoặc hiến tặng)
    // - dharmaTalk: Dharma talk or lecture (Buổi thuyết pháp hoặc giảng Pháp)
    // - other: Any other type of event
    type: {
      type: String,
      enum: ['apc', 'retreat', 'offering', 'dharmaTalk', 'other'],
      required: true,
      default: 'other',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt & updatedAt
    versionKey: false,
  },
)

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema)

export default Event
