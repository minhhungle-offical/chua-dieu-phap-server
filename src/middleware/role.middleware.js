// ✅ Middleware: Allow only 'staff' or 'admin'
// ✅ Middleware: Chỉ cho phép role 'staff' hoặc 'admin'
export const staffOrAdmin = (req, res, next) => {
  const role = req.user?.role

  if (role === 'admin' || role === 'staff') {
    return next()
  }

  return res.status(403).json({
    message: 'Bạn không có quyền thực hiện thao tác này.',
  })
}

// ✅ Middleware: Allow only 'admin'
// ✅ Middleware: Chỉ cho phép role 'admin'
export const adminOnly = (req, res, next) => {
  const role = req.user?.role

  if (role === 'admin') {
    return next()
  }

  return res.status(403).json({
    message: 'Chỉ quản trị viên mới có quyền truy cập.',
  })
}
