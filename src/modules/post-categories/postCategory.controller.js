import PostCategory from './postCategory.model.js'
import { sendSuccess, sendError } from '../../utils/response.js'
import { STATUS_CODES } from '../../utils/httpStatusCodes.js'
import { generateUniqueSlug } from '../../helper/slugHelper.js'

// Get all categories (with pagination & search optional)
export const getAllPostCategories = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = '', isActive } = req.query
    const filter = {}

    if (isActive !== undefined) filter.isActive = isActive === 'true'
    if (search) filter.name = { $regex: search, $options: 'i' }

    const skip = (page - 1) * limit
    const [categories, total] = await Promise.all([
      PostCategory.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      PostCategory.countDocuments(filter),
    ])

    return sendSuccess(res, 'Post categories fetched successfully', {
      data: categories,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, error.message)
  }
}

export const getActivePostCategories = async (req, res) => {
  try {
    const activeCategories = await PostCategory.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
    return sendSuccess(res, 'Active post categories fetched', activeCategories)
  } catch (error) {
    return sendError(res, 500, error.message)
  }
}

// Get one category by ID
export const getPostCategoryById = async (req, res) => {
  try {
    const category = await PostCategory.findById(req.params.id)
    if (!category) return sendError(res, STATUS_CODES.NOT_FOUND, 'Category not found')
    return sendSuccess(res, 'Category fetched successfully', category)
  } catch (error) {
    return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, error.message)
  }
}

// Create a new category
export const createPostCategory = async (req, res) => {
  const user = req.user

  try {
    const { name, description, isActive } = req.body

    if (!name) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Name is required')
    }

    const slug = await generateUniqueSlug(name, PostCategory)

    const newCategory = await PostCategory.create({
      name,
      slug,
      description,
      isActive,
      createdBy: user._id,
    })

    return sendSuccess(res, 'Category created successfully', newCategory, STATUS_CODES.CREATED)
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        STATUS_CODES.BAD_REQUEST,
        'Category with this name or slug already exists',
      )
    }
    return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, error.message)
  }
}

// Update a category by ID
export const updatePostCategory = async (req, res) => {
  console.log('req.body: ', req.body)
  try {
    const category = await PostCategory.findById(req.params.id)
    if (!category) return sendError(res, STATUS_CODES.NOT_FOUND, 'Category not found')

    const { name, description, isActive } = req.body

    if (name && name !== category.name) {
      category.slug = await generateUniqueSlug(name, PostCategory, category._id)
      category.name = name
    }

    if (description !== undefined) category.description = description
    if (isActive !== undefined) category.isActive = isActive

    await category.save()

    return sendSuccess(res, 'Category updated successfully', category)
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        STATUS_CODES.BAD_REQUEST,
        'Category with this name or slug already exists',
      )
    }
    return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, error.message)
  }
}

// Delete a category by ID
export const deletePostCategory = async (req, res) => {
  try {
    const category = await PostCategory.findById(req.params.id)
    if (!category) return sendError(res, STATUS_CODES.NOT_FOUND, 'Category not found')

    await category.deleteOne()
    return sendSuccess(res, 'Category deleted successfully')
  } catch (error) {
    return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, error.message)
  }
}
