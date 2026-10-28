const mongoose = require('mongoose');

const verificationVoteSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    voteType: {
      type: String,
      enum: ['confirm', 'flag'], // confirm genuine, or flag abuse/spam
      default: 'confirm',
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Enforce atomic guarantee: exactly 1 vote per user per report
verificationVoteSchema.index({ report: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('VerificationVote', verificationVoteSchema);
