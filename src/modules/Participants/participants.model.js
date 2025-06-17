import mongoose from 'mongoose'

const participantSchema = new mongoose.Schema(
  {
    // ==== 1. Basic personal information ====
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dharmaName: {
      type: String,
      trim: true,
      default: '',
    },
    birthday: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    job: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      trim: true,
      default: null, // URL to profile image (Cloudinary or local)
    },

    // ==== 2. Contact information ====
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      type: String,
      trim: true,
      match: /^[0-9]{8,15}$/,
    },

    // ==== 3. Event information ====
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'canceled'],
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFirstTime: {
      type: Boolean,
      default: true,
    },
    infoSource: {
      type: String,
      trim: true,
      default: '', // Where participant knew about the event
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },

    // ==== 4. Check-in and approval ====
    isCheckedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    hasAgreed: {
      type: Boolean,
      required: true,
      default: false, // Must agree to event rules or terms
    },

    // ==== 5. OTP & email verification ====
    otp: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // ==== 6. Retreat-specific options ====
    retreatInfo: {
      robeOption: {
        type: String,
        enum: ['none', 'borrow', 'buy'],
        default: 'none',
      },
      robeSize: {
        type: String,
        enum: ['S', 'M', 'L', 'XL', 'XXL'],
        default: null,
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    versionKey: false,
  },
)

const Participant = mongoose.model('Participant', participantSchema)
export default Participant
