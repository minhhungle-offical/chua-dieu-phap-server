import dotenv from 'dotenv'
import mongoose from 'mongoose'
import app from './app.js'
import { updateEventStatus } from './utils/updateEventStatus.js'

dotenv.config()

const port = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI

// Gọi lần đầu luôn khi server chạy
updateEventStatus()

// Chạy lại mỗi 10 phút
setInterval(updateEventStatus, 10 * 60 * 1000)

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err)
    process.exit(1)
  })
