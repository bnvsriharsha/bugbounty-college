const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  studentId: z.string().optional(),
  department: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const createReportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().min(15, 'Description must be at least 15 characters').max(2000),
  category: z.string().min(2, 'Category is required'),
  building: z.string().min(2, 'Building is required'),
  locationDetail: z.string().min(2, 'Location detail is required'),
  suggestedSeverity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  coordinates: z.object({
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
  }).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['reported', 'verified', 'assigned', 'fixing', 'resolved', 'rejected', 'duplicate', 'reopened']),
  note: z.string().optional(),
  rejectionReason: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedStaffId: z.string().optional(),
  duplicateOfId: z.string().optional(),
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors ? error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) : error.message,
    });
  }
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createReportSchema,
  updateStatusSchema,
};
