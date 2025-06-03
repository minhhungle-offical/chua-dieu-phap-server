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

postCategoryRouter.get('/', getAllPostCategories)
postCategoryRouter.get('/active', getActivePostCategories)
postCategoryRouter.get('/:id', getPostCategoryById)

postCategoryRouter.use(authMiddleware)

postCategoryRouter.post('/', authorize(['admin', 'staff']), createPostCategory)
postCategoryRouter.put('/:id', authorize(['admin', 'staff']), updatePostCategory)
postCategoryRouter.delete('/:id', authorize(['admin', 'staff']), deletePostCategory)

export default postCategoryRouter
