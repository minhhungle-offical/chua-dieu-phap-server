import express from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/authorize.middleware.js'
import {
  createPost,
  deletePost,
  getPostById,
  getPostBySlug,
  getPosts,
  updatePost,
} from './post.controller.js'
import { singleUpload } from '../../middleware/upload.js'
import { handleMulterError } from '../../middleware/handleMulterError.js'

const postRouter = express.Router()

postRouter.get('/', getPosts)
postRouter.get('/slug/:slug', getPostBySlug)
postRouter.get('/:id', getPostById)

postRouter.post(
  '/',
  authMiddleware,
  authorize(['admin', 'staff']),
  singleUpload,
  handleMulterError,
  createPost,
)
postRouter.put(
  '/:id',
  authMiddleware,
  authorize(['admin', 'staff']),
  singleUpload,
  handleMulterError,
  updatePost,
)
postRouter.delete('/:id', authMiddleware, authorize(['admin', 'staff']), deletePost)

export default postRouter
