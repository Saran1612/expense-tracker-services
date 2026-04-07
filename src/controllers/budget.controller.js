const Budget = require('../models/budget.model');
const Expense = require('../models/expense.model');

const getBudget = async (req, res) => {
    try {
        const budgets = await Budget.find({ user: req.user._id })
            .populate('category', 'name icon color');
        console.log(budgets, "budgets")
        if (!budgets || budgets.length === 0) {
            return res.status(200).json({
                message: 'No budgets found',
                budgets: []
            });
        }
        res.status(200).json({
            message: 'Budgets fetched successfully',
            budgets
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching budgets', error: error.message });
    }
}

const createCategoryBudget = async (req, res) => {
    try {
        const { amount, category } = req.body;
        if (!amount || !category) {
            return res.status(400).json({ message: "Amount and category are required" });
        }

        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        // Check if a budget already exists for this category
        const existingBudget = await Budget.findOne({
            user: req.user._id,
            category: category,
            type: 'category'
        });

        if (existingBudget) {
            return res.status(400).json({
                message: "A budget already exists for this category"
            });
        }

        // Calculate total spent for this category in the current month
        const expenses = await Expense.find({
            user: req.user._id, 
            category: category, 
            date: { $gte: startDate, $lte: endDate }
        });
        console.log(expenses, "expenseswhilecreatebudget");
        let totalSpent = 0;
        if(expenses.length > 0){
            totalSpent = expenses.reduce((acc, expense) => acc + expense.amount, 0);
            console.log(totalSpent, "totalSpent");
        }

        const budget = await Budget.create({
            user: req.user._id,
            type: 'category',
            amount,
            category,
            startDate,
            endDate,
            total_spent: totalSpent 
        })
        console.log(budget, "budgetchecking");
        if (budget) {
            const populatedBudget = await Budget.findById(budget._id)
                .populate('category', 'name icon color');
            res.status(200).json({
                message: `Category Budget created successfully`,
                budget: populatedBudget
            })
        } else {
            res.status(400).json({ message: "Error creating budget" });
        }
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                message: "A budget already exists for this category"
            });
        }
        res.status(500).json({ message: "Error creating budget", error: error.message })
    }
}

const createGlobalBudget = async (req, res) => {
    try {
        const { amount, note } = req.body;
        if (!amount || !note) {
            return res.status(400).json({ message: "Amount and note are required" });
        }

        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        // Check if a global budget already exists for this user
        const existingBudget = await Budget.findOne({
            user: req.user._id,
            type: 'global'
        });

        if (existingBudget) {
            return res.status(400).json({
                message: "A global budget already exists. You can only have one global budget."
            });
        }

        // Calculate total spent from all expenses in the current month (global budget)
        const expenses = await Expense.find({
            user: req.user._id,
            date: { $gte: startDate, $lte: endDate }
        });
        console.log(expenses, "expenseswhilecreateglobalbudget");
        let totalSpent = 0;
        if(expenses.length > 0){
            totalSpent = expenses.reduce((acc, expense) => acc + expense.amount, 0);
            console.log(totalSpent, "totalSpent");
        }

        const budget = await Budget.create({
            user: req.user._id,
            type: 'global',
            amount,
            note: note, // Store name in note field
            category: null, // No category for global budget
            startDate,
            endDate,
            total_spent: totalSpent 
        })
        console.log(budget, "globalbudgetchecking");
        if (budget) {
            res.status(200).json({
                message: "Global budget created successfully",
                budget: budget
            })
        } else {
            res.status(400).json({ message: "Error creating global budget" });
        }
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                message: "A global budget already exists. You can only have one global budget."
            });
        }
        res.status(500).json({ message: "Error creating global budget", error: error.message });
    }
}

const deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            const budget = await Budget.deleteMany({ user: req.user._id });
            return res.status(200).json({
                message: "All budgets deleted successfully",
                budget
            })
        } else {
            const budget = await Budget.findOneAndDelete({ _id: id, user: req.user._id });
            if (!budget) {
                return res.status(404).json({ message: "Budget not found" });
            }
            res.status(200).json({
                message: "Budget deleted successfully",
                budget
            })
        }
    } catch (error) {
        res.status(500).json({ message: "Error deleting budget", error: error.message });
    }
}

module.exports = {
    getBudget,
    createCategoryBudget,
    createGlobalBudget,
    deleteBudget
}

