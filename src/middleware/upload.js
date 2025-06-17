import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'

// ===== Cloudinary image storage config =====
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'chua-dieu-phap',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      allowed_formats: ['jpg', 'jpeg', 'png'],
      transformation: [
        { width: 1000, crop: 'scale' }, // Resize to width 1000px, keep original aspect ratio
        { quality: 'auto' }, // Automatically adjust quality for optimization
        { fetch_format: 'auto' }, // Convert to WebP/AVIF if supported
      ],
    }
  },
})

// ===== File type filter =====
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, JPEG, and PNG formats are allowed.'), false)
  }
}

// ===== Multer config (no file size limit, optimized via Cloudinary) =====
const upload = multer({
  storage: imageStorage,
  fileFilter,
})

// ===== Middleware exports =====

// For uploading a single image (field name: 'thumbnail')
export const singleUpload = upload.single('thumbnail')

// For uploading multiple images (field name: 'images', max 5 files)
export const multipleUpload = upload.array('images', 5)

export default upload
