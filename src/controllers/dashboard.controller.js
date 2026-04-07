const Expense = require('../models/expense.model');
const Category = require('../models/category.model');
const Budget = require('../models/budget.model');

const getDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;

        // Calculate current month's start and end dates
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        // 1. Total spent - get all expenses for the current month
        const expenses = await Expense.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        // 2. Month budget - get the global budget's amount
        const globalBudget = await Budget.findOne({
            user: userId,
            type: 'global'
        });

        const monthBudget = globalBudget ? globalBudget.amount : 0;

        // 3. Remaining - month budget - total spent
        const remaining = monthBudget - totalSpent;

        // 4. Total available Category - count of all categories (both status true and false)
        const totalCategories = await Category.countDocuments({
            user: userId
        });

        // 5. Recent transactions - get last 5 expenses (latest)
        const recentTransactions = await Expense.find({
            user: userId
        })
        .populate('category', 'name icon color')
        .sort({ date: -1, createdAt: -1 }) // Sort by date descending, then by creation time
        .limit(5);

        console.log(startDate,endDate, "endDateendDate");

        // 6. Daily Spending Trend - aggregate expenses by day for current month
        const dailySpending = await Expense.aggregate([
            {
                $match: {
                    user: userId,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$date'
                        }
                    },
                    total: { $sum: '$amount' }
                }
            },
            {
                $sort: { _id: 1 } // Sort by date ascending
            }
        ]);

        // Get total days in current month
        const daysInMonth = endDate.getDate();
        
        // Create a map of date to spending amount
        const spendingMap = {};
        dailySpending.forEach(item => {
            spendingMap[item._id] = item.total;
        });

        // Build arrays for chart: xAxis (day labels) and data (spending amounts)
        const dailySpendingXAxis = [];
        const dailySpendingData = [];

        // Iterate through each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(now.getFullYear(), now.getMonth(), day);
            const dateKey = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            // Add day label (e.g., "Day 1", "Day 2" or just "1", "2")
            dailySpendingXAxis.push(`Day ${day}`);
            
            // Add spending amount for this day (0 if no expenses)
            dailySpendingData.push(spendingMap[dateKey] || 0);
        }

        // 7. Category-wise spending - aggregate expenses by category for current month
        const categorySpending = await Expense.aggregate([
            {
                $match: {
                    user: userId,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' }
                }
            },
            {
                $lookup: {
                    from: 'Category',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: {
                    path: '$categoryInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    name: { $ifNull: ['$categoryInfo.name', 'Unknown'] },
                    value: { $round: ['$total', 2] }
                }
            },
            {
                $sort: { value: -1 } // Sort by spending amount descending
            }
        ]);

        // Format data for PieChart component: [{ name: 'Category', value: amount }]
        const categoryWiseSpending = categorySpending.map(item => ({
            name: item.name,
            value: item.value
        }));

        res.status(200).json({
            message: 'Dashboard data fetched successfully',
            data: {
                totalSpent,
                monthBudget,
                remaining,
                totalCategories,
                recentTransactions,
                dailySpendingTrend: {
                    xAxis: dailySpendingXAxis,
                    data: dailySpendingData
                },
                categoryWiseSpending
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
}

module.exports = { getDashboardData };