import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'

// Khởi tạo cấu hình lưu trữ lên Cloudinary
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'chua-dieu-phap',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      allowed_formats: ['jpg', 'jpeg', 'png'],
      transformation: [
        { width: 1280, height: 720, crop: 'fill' }, // Tỉ lệ 16:9 (1280x720)
        { quality: 'auto' }, // Tự động giảm chất lượng để tối ưu
        { fetch_format: 'auto' }, // Chuyển sang webp nếu cần
      ],
    }
  },
})

// Lọc chỉ cho phép các định dạng ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, JPEG, and PNG files are allowed'), false)
  }
}

// Không giới hạn kích thước file ở đây vì đã xử lý resize/nén ở Cloudinary
const upload = multer({
  storage: imageStorage,
  fileFilter,
})

// Middleware cho 1 file ảnh duy nhất (field name: 'thumbnail')
export const singleUpload = upload.single('thumbnail')

// Middleware cho nhiều file ảnh  (field name: 'images')
export const multipleUpload = upload.array('images', 5)

export default upload
