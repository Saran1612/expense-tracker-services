const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
    trim: true
  },
  cloudinaryId: {
    type: String,
    trim: true
  },
  cloudinaryUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'Expense'
});

// export default mongoose.model('Expense', expenseSchema);

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense; 
