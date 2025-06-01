import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'chua-dieu-phap',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      allowed_formats: ['jpg', 'jpeg', 'png'],
      transformation: [{ width: 300, height: 300, crop: 'fill' }],
    }
  },
})

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, JPEG, and PNG files are allowed'), false)
  }
}

const upload = multer({
  storage: imageStorage,
  fileFilter,
  limits: { fileSize: 300 * 1024 }, // 300KB
})

export const singleUpload = upload.single('thumbnail') // You can rename 'thumbnail' to 'avatar' if needed

export default upload
