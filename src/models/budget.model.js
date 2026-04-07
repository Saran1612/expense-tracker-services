const mongoose = require('mongoose');
const budgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['category', 'global'],
        required: true,
    },
    note: {
        type: String,
        required: false,
    },
    amount: {
        type: Number,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: function() {
            return this.type === 'category';
        },
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: Boolean,
        default: true,
    },
    total_spent: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true,
    collection: 'Budget'
})

// Add compound unique index for user and category (for category budgets)
budgetSchema.index({ user: 1, category: 1 }, { unique: true, sparse: true });

// Add unique index for user and type (for global budgets - one per user)
budgetSchema.index({ user: 1, type: 1 }, { unique: true, partialFilterExpression: { type: 'global' } });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;