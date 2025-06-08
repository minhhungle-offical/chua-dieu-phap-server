import mongoose from 'mongoose'

const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    phoneNumber: {
      type: String,
      trim: true,
      match: /^[0-9]{8,15}$/,
    },

    note: {
      type: String,
      trim: true,
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
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
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
    avatar: {
      type: String,
      trim: true,
      default: '',
    },

    job: {
      type: String,
      trim: true,
      default: '',
    },
    infoSource: {
      type: String,
      trim: true,
      default: '',
    },
    isFirstTime: {
      type: Boolean,
      default: true,
    },
    hasAgreed: {
      type: Boolean,
      required: true,
      default: false,
    },

    otp: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    isEmailVerified: { type: Boolean, default: false },

    isCheckedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

const Participant = mongoose.model('Participant', participantSchema)
export default Participant
