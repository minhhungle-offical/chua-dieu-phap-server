import express from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/authorize.middleware.js'
import { createPost, deletePost, getPostById, getPosts, updatePost } from './post.controller.js'
import { singleUpload } from '../../middleware/upload.js'
import { handleMulterError } from '../../middleware/handleMulterError.js'

const postRouter = express.Router()

postRouter.get('/', getPosts)
postRouter.get('/:id', getPostById)

postRouter.use(authMiddleware)

postRouter.post('/', authorize(['admin', 'staff']), singleUpload, handleMulterError, createPost)
postRouter.put('/:id', authorize(['admin', 'staff']), singleUpload, handleMulterError, updatePost)
postRouter.delete('/:id', authorize(['admin', 'staff']), deletePost)

export default postRouter
