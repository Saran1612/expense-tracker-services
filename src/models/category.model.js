const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // null or default value means predefined
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  icon: {
    type: String, // optional: for frontend UI (e.g. emoji or icon name)
    default: '',
  },
  color: {
    type: String, // optional: for frontend color (e.g. "#FF9900")
    default: '',
  },
  status: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
  unique: true,
  collection: 'Category'
});

categorySchema.index({ user: 1, name: 1 }, { unique: true }); // prevent duplicate category names per user

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 
