import mongoose from 'mongoose'

const { Schema, model } = mongoose

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'user'],
      default: 'user',
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },

    birthday: Date,
    address: String,

    dharmaName: String,
    hasTakenRefuge: Boolean,

    avatarUrl: String,
    ordinationDate: Date,

    emailVerificationOtp: String,
    emailVerificationExpires: Date,
  },
  {
    collection: 'users',
    timestamps: true,
  },
)

export const User = model('User', userSchema)
export default User
