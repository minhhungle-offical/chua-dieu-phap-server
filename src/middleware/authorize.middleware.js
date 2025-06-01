export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    const user = req.user
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    // Giả sử user.roles là mảng chứa các vai trò của user
    const hasRole = user.roles.some((role) => allowedRoles.includes(role))
    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient role' })
    }

    next()
  }
}
