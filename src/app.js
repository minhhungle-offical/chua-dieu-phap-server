import bodyParser from 'body-parser'
import cors from 'cors'
import { config } from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import authRouter from './modules/auth/auth.router.js'
import userRouter from './modules/users/user.router.js'
import eventRouter from './modules/events/event.router.js'
import postCategoryRouter from './modules/post-categories/postCategory.router.js'
import postRouter from './modules/posts/post.router.js'
import uploadRouter from './modules/upload/upload.router.js'
import participantRoutes from './modules/Participants/participant.router.js'

config()

const app = express()
const port = process.env.PORT || 8080

// Middleware
const allowedOrigins = [
  '*',
  'https://chuadieuphapbinhthanh.vercel.app',
  'http://localhost:3000',
  'http://192.168.1.143:3000',
  'http://localhost:5173',
  'https://chua-dieu-phap-admin.vercel.app',
]

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Không được phép truy cập tài nguyên (CORS)'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
}

// Middleware
app.use(cors(corsOptions))
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Ignore favicon.ico
app.get('/favicon.ico', (_, res) => res.sendStatus(204))

// Routes
app.use('/api/events', eventRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/post-categories', postCategoryRouter)
app.use('/api/posts', postRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/participants', participantRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// 500 handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err)
  res.status(500).json({ error: 'Internal Server Error' })
})

export default app
