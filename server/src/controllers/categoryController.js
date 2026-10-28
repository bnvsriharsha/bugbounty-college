const Category = require('../models/Category');

// @desc    Get all active categories
// @route   GET /api/v1/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category (Admin only)
// @route   POST /api/v1/categories
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, slaHours, icon } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const category = await Category.create({
      name,
      slug,
      description: description || '',
      slaHours: slaHours || 48,
      icon: icon || 'AlertCircle',
    });

    res.status(201).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category (Admin only)
// @route   PATCH /api/v1/categories/:id
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: { category } });
  } catch (error) {
    next(error);
  }
};
