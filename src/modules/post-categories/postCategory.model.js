import mongoose from 'mongoose'

const postCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    versionKey: false, // Removes __v
    collection: 'post_categories', // Explicit collection name
  },
)

export default mongoose.model('PostCategory', postCategorySchema)
