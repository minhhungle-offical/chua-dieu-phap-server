import mongoose from 'mongoose'

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    thumbnail: {
      url: String,
      publicId: String,
    },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PostCategory',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
)
const Post = mongoose.model('Post', postSchema)
export default Post
