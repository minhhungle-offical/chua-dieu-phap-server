import express from 'express'
import {
  getAllPostCategories,
  getPostCategoryById,
  createPostCategory,
  updatePostCategory,
  deletePostCategory,
  getActivePostCategories,
} from './postCategory.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/authorize.middleware.js'

const postCategoryRouter = express.Router()

// 🔓 Public routes
postCategoryRouter.get('/', getAllPostCategories)
postCategoryRouter.get('/active', getActivePostCategories) // Must come before "/:id"
postCategoryRouter.get('/:id', getPostCategoryById)

// 🔐 Protected routes - only Admin and Staff can access
postCategoryRouter.post('/', authMiddleware, authorize(['admin', 'staff']), createPostCategory)

postCategoryRouter.put('/:id', authMiddleware, authorize(['admin', 'staff']), updatePostCategory)

postCategoryRouter.delete('/:id', authMiddleware, authorize(['admin', 'staff']), deletePostCategory)

export default postCategoryRouter
