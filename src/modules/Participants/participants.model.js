import mongoose from 'mongoose'

const participantSchema = new mongoose.Schema(
  {
    // ==== 1. Basic personal info ====
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dharmaName: String,
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
    address: String,
    avatar: {
      type: String,
      trim: true,
      default: '',
    },

    // ==== 2. Contact info ====
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

    // ==== 3. Event info ====
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
      default: '',
    },
    note: {
      type: String,
      trim: true,
    },

    // ==== 4. Retreat-specific options ====
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

    // ==== 5. Check-in & approval ====
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
      default: false,
    },

    // ==== 6. OTP verification ====
    otp: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    isEmailVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  },
)

const Participant = mongoose.model('Participant', participantSchema)
export default Participant
