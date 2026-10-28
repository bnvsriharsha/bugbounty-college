const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  // Return clean sanitized user object
  const sanitizedUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    department: user.department,
    reputation: user.reputation,
    reportsSubmitted: user.reportsSubmitted,
    reportsVerified: user.reportsVerified,
    avatar: user.avatar,
  };

  res.status(statusCode).json({
    success: true,
    token, // Also send token in body for client flexibility
    data: { user: sanitizedUser },
  });
};

module.exports = { signToken, sendTokenResponse };
