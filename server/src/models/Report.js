const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema(
  {
    fromStatus: { type: String, default: null },
    toStatus: { type: String, required: true },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: { type: String, default: '' },
    actorRole: { type: String, default: '' },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [15, 'Description must be at least 15 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    building: {
      type: String,
      required: [true, 'Building/Zone is required'],
      trim: true,
    },
    locationDetail: {
      type: String,
      required: [true, 'Specific location is required (e.g. Room 302, 3rd Floor)'],
      trim: true,
    },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
      },
    ],
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    suggestedSeverity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['reported', 'verified', 'assigned', 'fixing', 'resolved', 'rejected', 'duplicate', 'reopened'],
      default: 'reported',
      index: true,
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    expectedResolutionTime: {
      type: Date,
      default: null,
    },
    resolutionEvidence: {
      notes: { type: String, default: '' },
      images: [
        {
          url: { type: String, required: true },
          publicId: { type: String, default: '' },
        },
      ],
      completedAt: { type: Date, default: null },
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null,
    },
    reopenHistory: [
      {
        reason: { type: String, required: true },
        reopenedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reopenedAt: { type: Date, default: Date.now },
      },
    ],
    history: [historyEntrySchema],
    flagCount: {
      type: Number,
      default: 0,
    },
    isFlaggedForAbuse: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for high performance searching and filtering
reportSchema.index({ status: 1, priority: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ building: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ assignedStaff: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ title: 'text', description: 'text', locationDetail: 'text' });

module.exports = mongoose.model('Report', reportSchema);
