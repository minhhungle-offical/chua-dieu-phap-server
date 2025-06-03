export const authorize = (allowedRoles = []) => {
  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles]
  }

  return (req, res, next) => {
    const user = req.user
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user info',
      })
    }

    const userRole = user.role
    const hasAccess = allowedRoles.includes(userRole)

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient role',
      })
    }

    next()
  }
}
