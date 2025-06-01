export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large. Max size is 300KB.'
          : 'File upload error.',
    })
  }
  next(err)
}
