import { generateUniqueSlug } from '../../helper/slugHelper.js'
import { STATUS_CODES } from '../../utils/httpStatusCodes.js'
import { sendError, sendSuccess } from '../../utils/response.js'
import Post from './post.model.js'
import cloudinary from '../../config/cloudinary.js'

// Create Post
export const createPost = async (req, res) => {
  try {
    const { title, shortDescription, content, category, isActive } = req.body

    if (!title || title.trim() === '') {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Tiêu đề là bắt buộc')
    }

    const slug = await generateUniqueSlug(title.trim(), Post)

    let thumbnail = null
    if (req.file) {
      thumbnail = {
        url: req.file.path,
        publicId: req.file.filename,
      }
    }

    const newPostData = {
      title: title.trim(),
      shortDescription: shortDescription?.trim() || '',
      content,
      category,
      thumbnail,
      isActive: isActive !== undefined ? isActive : true,
      slug,
      author: req.user._id,
    }

    const post = await Post.create(newPostData)

    return sendSuccess(res, 'Tạo bài viết thành công', post, STATUS_CODES.CREATED)
  } catch (error) {
    console.error('Lỗi khi tạo bài viết:', error)
    return sendError(res, STATUS_CODES.INTERNAL_SERVER, 'Lỗi server')
  }
}

// Get All Posts with Filter & Pagination
export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive } = req.query

    const filter = {}
    if (search) filter.title = { $regex: search, $options: 'i' }
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const total = await Post.countDocuments(filter)
    const posts = await Post.find(filter)
      .populate('category', 'name')
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    return sendSuccess(res, 'Lấy danh sách bài viết thành công', {
      data: posts,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    return sendError(res, STATUS_CODES.INTERNAL_SERVER, err.message)
  }
}

// Get Post by ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('category', 'name')
      .populate('author', 'name email')

    if (!post) return sendError(res, STATUS_CODES.NOT_FOUND, 'Không tìm thấy bài viết')

    return sendSuccess(res, 'Lấy bài viết thành công', post)
  } catch (err) {
    return sendError(res, STATUS_CODES.INTERNAL_SERVER, err.message)
  }
}

// Update Post
export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id
    const { title, ...rest } = req.body

    const existingPost = await Post.findById(postId)
    if (!existingPost) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Bài viết không tồn tại')
    }

    const updateData = { ...rest }

    if (title && title.trim() !== existingPost.title) {
      updateData.title = title.trim()
      updateData.slug = await generateUniqueSlug(title.trim(), Post, postId)
    }

    if (req.file) {
      if (existingPost.thumbnail?.publicId) {
        await cloudinary.uploader.destroy(existingPost.thumbnail.publicId)
      }

      updateData.thumbnail = {
        url: req.file.path,
        publicId: req.file.filename,
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, {
      new: true,
      runValidators: true,
    })

    return sendSuccess(res, 'Cập nhật bài viết thành công', updatedPost)
  } catch (error) {
    console.error('🔴 [UpdatePost Error]:', error)
    return sendError(res, STATUS_CODES.INTERNAL_SERVER, 'Lỗi server khi cập nhật bài viết')
  }
}

// Delete Post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id)
    if (!post) return sendError(res, STATUS_CODES.NOT_FOUND, 'Không tìm thấy bài viết')

    return sendSuccess(res, 'Xoá bài viết thành công')
  } catch (err) {
    return sendError(res, STATUS_CODES.INTERNAL_SERVER, err.message)
  }
}
