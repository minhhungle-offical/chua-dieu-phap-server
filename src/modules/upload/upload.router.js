import { Router } from 'express'
import { singleUpload } from '../../middleware/upload.js'
import { v2 as cloudinary } from 'cloudinary'

const uploadRouter = Router()

// Upload file
uploadRouter.post('/', singleUpload, async (req, res) => {
  try {
    const file = req.file

    if (!file) {
      return res.status(400).json({ message: 'Không có file nào được tải lên.' })
    }

    return res.status(200).json({
      message: 'Tải file thành công.',
      data: {
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: file.path || file.url,
        public_id: file.filename || file.public_id,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ message: 'Lỗi trong quá trình upload file.' })
  }
})

// Xoá file (ví dụ với Cloudinary)
uploadRouter.delete('/:public_id', async (req, res) => {
  try {
    const { public_id } = req.params

    if (!public_id) {
      return res.status(400).json({ message: 'Thiếu public_id để xoá file.' })
    }

    const result = await cloudinary.uploader.destroy(public_id)

    if (result.result !== 'ok') {
      return res.status(400).json({ message: 'Xoá file thất bại.', result })
    }

    return res.status(200).json({
      message: 'Xoá file thành công.',
      result,
    })
  } catch (error) {
    console.error('Delete error:', error)
    return res.status(500).json({ message: 'Lỗi trong quá trình xoá file.' })
  }
})

export default uploadRouter
