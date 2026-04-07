const Expense = require('../models/expense.model')
const Category = require('../models/category.model')
const csv = require('csv-parser');
const fs = require('fs');
const Budget = require('../models/budget.model');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const getExpenses = async (req, res) => {
    try {
        const { category, tags, startDate, endDate } = req.query;
        console.log(category, tags, startDate, endDate, "categorytagsstartDateendDate")
        
        // Check if any filters are present
        const hasFilters = category || tags || startDate || endDate;
        console.log(hasFilters, "hasFilters")

        if (hasFilters) {
            // Build the query object for filtered results
            const query = { user: req.user._id };

            // Add category filter if provided
            if (category) {
                console.log(category, "category")
                query.category = category;
            }

            // Add tags filter if provided
            if (tags) {
                console.log(tags, "sdfdgfdgfdgdf")
                const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
                console.log(tagArray, "tagArray")
                query.tags = { $in: tagArray };
            }

            // Add date range filter if provided
            if (startDate || endDate) {
                console.log(startDate, endDate, "startDateendDate")
                query.date = {};
                if (startDate) {
                    // Set to start of the day
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    query.date.$gte = start;
                    console.log(query.date.$gte, "query.date.$gte")
                }
                if (endDate) {
                    // Set to end of the day
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    query.date.$lte = end;
                    console.log(query.date.$lte, "query.date.$lte")
                }
            }

            // Execute the filtered query
            const filteredExpenses = await Expense.find(query)
                .populate('category', 'name icon color')
                .sort({ date: -1 });
            console.log(filteredExpenses, "filteredExpenses")
            if (!filteredExpenses || filteredExpenses.length === 0) {
                return res.status(200).json({
                    message: 'No expenses found matching the filters',
                    expenses: [],
                    filters: {
                        category,
                        tags: tags ? (typeof tags === 'string' ? tags.split(',') : tags) : undefined,
                        startDate,
                        endDate
                    }
                });
            }

            return res.status(200).json({
                message: 'Filtered expenses fetched successfully',
                expenses: filteredExpenses,
                total: filteredExpenses.length,
                filters: {
                    category,
                    tags: tags ? (typeof tags === 'string' ? tags.split(',') : tags) : undefined,
                    startDate,
                    endDate
                }
            });
        }

        // If no filters, return all expenses
        const allExpenses = await Expense.find({ user: req.user._id })
            .populate('category', 'name icon color')
            .sort({ date: -1 });

        if (!allExpenses || allExpenses.length === 0) {
            return res.status(200).json({
                message: 'No expenses found',
                expenses: []
            });
        }

        res.status(200).json({
            message: 'All expenses fetched successfully',
            expenses: allExpenses,
            total: allExpenses.length
        });

    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({
            message: 'Error fetching expenses',
            error: error.message
        });
    }
}

const saveExpenseInternal = async (userId, expenseData) => {
    const expenses = Array.isArray(expenseData) ? expenseData : [expenseData];

    return await Promise.all(
        expenses.map(async (expense) => {
            const { amount, note, category, tags, date } = expense;
            let cleanedTags = [];
            if (tags && tags.length > 0) {
                cleanedTags = tags.map(tag => tag.replace(/[\[\]'"]/g, '').trim());
            }

            // Update budget total spent
            await calculateTotalSpent(category, amount, userId);

            return new Expense({
                user: userId,
                amount,
                category,
                note: note || '',
                tags: cleanedTags,
                date: date || Date.now(),
            }).save();
        })
    );
};

const createExpense = async (req, res) => {
    try {
        const expenses = Array.isArray(req.body) ? req.body : [req.body];

        for (const expense of expenses) {
            const { amount, note, category } = expense;
            if (!amount || !category || !note) {
                return res.status(400).json({ message: 'Amount, category and note are required' });
            }
            if (isNaN(amount) || amount <= 0) {
                return res.status(400).json({ message: 'Amount must be a positive number' });
            }
        }

        const createdExpenses = await saveExpenseInternal(req.user._id, req.body);

        res.status(200).json({
            message: 'Expense created successfully',
            createdExpense: createdExpenses
        });
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({
            message: 'Error creating expense',
            error: error.message
        });
    }
}

// Update category budget total_spent (if budget exists for this category)
const updateCategoryBudget = async (category, amount, userId) => {
    try {
        // Use atomic $inc operator to avoid race conditions when processing multiple expenses in parallel
        const budget = await Budget.findOneAndUpdate(
            { user: userId, category: category, type: 'category' },
            { $inc: { total_spent: amount } },
            { new: true }
        );
        return budget;
    } catch (error) {
        console.error('Error updating category budget:', error);
        // Don't throw - budget might not exist for this category
        return null;
    }
}

// Update global budget total_spent (always update if global budget exists)
const updateGlobalBudget = async (amount, userId) => {
    try {
        // Use atomic $inc operator to avoid race conditions when processing multiple expenses in parallel
        const budget = await Budget.findOneAndUpdate(
            { user: userId, type: 'global' },
            { $inc: { total_spent: amount } },
            { new: true }
        );
        return budget;
    } catch (error) {
        console.error('Error updating global budget:', error);
        // Don't throw - global budget might not exist
        return null;
    }
}

// Update both category and global budgets
const calculateTotalSpent = async (category, amount, userId) => {
    console.log(category, amount, userId, "expensedatatosave")
    try {
        // Update category budget if it exists
        await updateCategoryBudget(category, amount, userId);
        
        // Update global budget if it exists
        await updateGlobalBudget(amount, userId);
        
        return true;
    } catch (error) {
        console.error('Error calculating total spent:', error);
        throw error;
    }
}

const updateExpense = async (req, res) => {
    try {
        const { id } = req.params
        const { amount, note, category, tags, date } = req.body
        console.log(amount, note, category, tags, id, "dfdgdgfg")
        if (!amount || !category) {
            return res.status(400).json({
                message: 'Amount and category are required'
            });
        }

        // Get the old expense first to calculate budget differences
        const oldExpense = await Expense.findOne({ _id: id, user: req.user._id });
        if (!oldExpense) {
            return res.status(404).json({
                message: 'Expense not found'
            });
        }

        // Clean and format tags
        let cleanedTags = [];
        if (tags && tags.length > 0) {
            cleanedTags = tags.map(tag => {
                // Remove any brackets, quotes, and trim whitespace
                return tag.replace(/[\[\]'"]/g, '').trim();
            });
        }

        const expense = await Expense.findOneAndUpdate(
            { _id: id, user: req.user._id },
            {
                amount,
                note,
                category,
                tags: cleanedTags,
                date: date || Date.now()
            },
            { new: true }
        );

        if (!expense) {
            return res.status(404).json({
                message: 'Expense not found'
            });
        }

        // Update budgets based on the difference
        const oldAmount = oldExpense.amount;
        const newAmount = parseFloat(amount);
        const amountDifference = newAmount - oldAmount;

        // If category changed, update both old and new category budgets
        const oldCategoryId = oldExpense.category ? oldExpense.category.toString() : null;
        const newCategoryId = category ? category.toString() : null;

        if (oldCategoryId !== newCategoryId) {
            // Subtract from old category budget
            if (oldCategoryId) {
                await updateCategoryBudget(oldExpense.category, -oldAmount, req.user._id);
            }
            // Add to new category budget
            if (newCategoryId) {
                await updateCategoryBudget(category, newAmount, req.user._id);
            }
            // Global budget: subtract old amount, add new amount
            await updateGlobalBudget(amountDifference, req.user._id);
        } else {
            // Same category, just update the difference
            if (amountDifference !== 0) {
                if (newCategoryId) {
                    await updateCategoryBudget(category, amountDifference, req.user._id);
                }
                await updateGlobalBudget(amountDifference, req.user._id);
            }
        }

        res.status(200).json({
            message: 'Expense updated successfully',
            expense
        });

    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({
            message: 'Error updating expense',
            error: error.message
        });
    }
}

const deleteExpenseInternal = async (userId, expenseId) => {
    // Get the expense first to update budgets
    const expense = await Expense.findOne({ _id: expenseId, user: userId });
    if (!expense) {
        throw new Error('Expense not found');
    }

    // Delete the expense
    const deletedExpense = await Expense.findOneAndDelete({ _id: expenseId, user: userId });

    // Update budgets: subtract the amount from category and global budgets
    if (expense.category) {
        await updateCategoryBudget(expense.category, -expense.amount, userId);
    }
    await updateGlobalBudget(-expense.amount, userId);

    return deletedExpense;
};

const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedExpense = await deleteExpenseInternal(req.user._id, id);

        res.status(200).json({
            message: 'Expense deleted successfully',
            expense: deletedExpense
        });
    } catch (error) {
        console.error('Error deleting expense:', error);
        const statusCode = error.message === 'Expense not found' ? 404 : 500;
        res.status(statusCode).json({
            message: error.message || 'Error deleting expense',
            error: error.message
        });
    }
}

const deleteAllExpenses = async (req, res) => {
    try {
        // Get all expenses before deleting to update budgets
        const allExpenses = await Expense.find({ user: req.user._id });
        
        // Calculate total amounts per category and global total
        const categoryTotals = {};
        let globalTotal = 0;
        
        allExpenses.forEach(expense => {
            const category = expense.category;
            if (category) {
                const categoryId = category.toString();
                if (!categoryTotals[categoryId]) {
                    categoryTotals[categoryId] = { category: category, total: 0 };
                }
                categoryTotals[categoryId].total += expense.amount;
            }
            globalTotal += expense.amount;
        });
        
        // Update category budgets (subtract amounts)
        for (const [categoryId, data] of Object.entries(categoryTotals)) {
            await updateCategoryBudget(data.category, -data.total, req.user._id);
        }
        
        // Update global budget
        if (globalTotal > 0) {
            await updateGlobalBudget(-globalTotal, req.user._id);
        }
        
        // Delete all expenses
        const expenses = await Expense.deleteMany({ user: req.user._id });
        res.status(200).json({
            message: 'All expenses deleted successfully',
            expenses
        });
    } catch (error) {
        console.error('Error deleting all expenses:', error);
        res.status(500).json({
            message: 'Error deleting all expenses',
            error: error.message
        });
    }
}

const uploadExpensesFromCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Step 1: Validate file
        if (req.file.size > 5 * 1024 * 1024) { // 5MB
            return res.status(400).json({ message: 'File size exceeds 5MB limit' });
        }

        if (!req.file.mimetype.includes('csv')) {
            return res.status(400).json({ message: 'Only CSV files are allowed' });
        }

        // Step 2: Parse and validate CSV data
        const results = [];
        let parseError = null;

        await new Promise((resolve, reject) => {
            const stream = require('stream');
            const bufferStream = new stream.PassThrough();
            bufferStream.end(req.file.buffer);

            bufferStream
                .pipe(csv())
                .on('data', (data) => {
                    try {
                        // Validate each row
                        if (!data.amount || !data.category) {
                            parseError = new Error('Amount and category are required in all rows');
                            return;
                        }
                        if (isNaN(parseFloat(data.amount))) {
                            parseError = new Error('Amount must be a valid number');
                            return;
                        }
                        results.push(data);
                    } catch (error) {
                        parseError = error;
                    }
                })
                .on('error', (error) => {
                    parseError = error;
                    reject(error);
                })
                .on('end', () => {
                    resolve();
                });
        });

        // If there was a parsing error, return
        if (parseError) {
            return res.status(400).json({
                message: 'Error parsing CSV file',
                error: parseError.message
            });
        }

        // Validate that we have data
        if (results.length === 0) {
            return res.status(400).json({
                message: 'CSV file is empty or contains no valid data'
            });
        }

        // Step 3: Validate categories
        const uniqueCategoryIds = [...new Set(results.map(row => row.category))];
        const existingCategories = await Category.find({
            _id: { $in: uniqueCategoryIds },
            user: req.user._id
        });

        // Check if all categories exist
        const existingCategoryIds = existingCategories.map(cat => cat._id.toString());
        const missingCategories = uniqueCategoryIds.filter(catId => !existingCategoryIds.includes(catId));

        if (missingCategories.length > 0) {
            return res.status(400).json({
                message: 'Some categories do not exist',
                missingCategories: missingCategories
            });
        }

        // Create a map of category IDs to their objects
        const categoryMap = {};
        existingCategories.forEach(cat => {
            categoryMap[cat._id.toString()] = cat._id;
        });

        // Step 4: Upload to Cloudinary
        let cloudinaryResult;
        try {
            // Convert buffer to base64
            const base64Data = req.file.buffer.toString('base64');
            const dataUri = `data:${req.file.mimetype};base64,${base64Data}`;

            cloudinaryResult = await cloudinary.uploader.upload(dataUri, {
                resource_type: 'raw',
                folder: 'expenses-csv',
                format: 'csv'
            });
        } catch (cloudinaryError) {
            console.error('Cloudinary upload error:', cloudinaryError);
            return res.status(500).json({
                message: 'Error uploading file to Cloudinary',
                error: cloudinaryError.message
            });
        }

        // Step 5: Save to MongoDB
        try {
            const expenses = results.map(row => {
                // Validate and parse date
                let parsedDate = new Date();
                if (row.date) {
                    parsedDate = new Date(row.date);
                    if (isNaN(parsedDate.getTime())) {
                        parsedDate = new Date(); // Fallback to current date if invalid
                    }
                }

                return {
                    user: req.user._id,
                    amount: parseFloat(row.amount),
                    category: categoryMap[row.category], // Use the category ID from the map
                    note: row.note || '',
                    tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
                    date: parsedDate,
                    cloudinaryId: cloudinaryResult.public_id,
                    cloudinaryUrl: cloudinaryResult.secure_url
                };
            });

            const createdExpenses = await Promise.all(
                expenses.map(async expense => {
                    const savedExpense = await new Expense(expense).save();
                    // Update budgets for this expense
                    await calculateTotalSpent(expense.category, expense.amount, req.user._id);
                    return savedExpense;
                })
            );

            res.status(201).json({
                message: 'Expenses uploaded successfully',
                createdExpenses,
                totalExpenses: createdExpenses.length,
                csvFileUrl: cloudinaryResult.secure_url
            });
        } catch (dbError) {
            // If database operation fails, delete from Cloudinary
            if (cloudinaryResult && cloudinaryResult.public_id) {
                try {
                    await cloudinary.uploader.destroy(cloudinaryResult.public_id);
                } catch (error) {
                    console.error('Error deleting file from Cloudinary:', error);
                }
            }
            throw dbError;
        }
    } catch (error) {
        console.error('Error processing CSV:', error);
        res.status(500).json({
            message: 'Error processing CSV file',
            error: error.message
        });
    }
}

const getMonthlyExpenses = async(req,res) => {
try{
    const existingExpenses = await Expense.find({user : req.user._id});

   if(!existingExpenses || existingExpenses.length === 0){
        return res.status(200).json({
            message: 'No expenses found',
            expenses: []
        });
    }
    
    // Group expenses by month
    const monthlyExpenses = existingExpenses.reduce((acc, expense) => {
        const date = new Date(expense.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // Adding 1 as getMonth() returns 0-11
        
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`; // Format: YYYY-MM
        
        if (!acc[monthKey]) {
            acc[monthKey] = {
                month: monthKey,
                expenses: [],
                totalAmount: 0
            };
        }
        
        acc[monthKey].expenses.push(expense);
        acc[monthKey].totalAmount += expense.amount;
        
        return acc;
    }, {});
    
    // Convert to array for easier consumption by frontend
    const monthlyExpensesArray = Object.values(monthlyExpenses);
    
    res.status(200).json({
        success: true,
        data: monthlyExpensesArray
    });

}catch(err){
    console.error('Error fetching monthly expenses:', err);
    res.status(500).json({
        message: 'Error fetching monthly expenses',
        error: err.message
    });
}
}

const getYearlyExpenses = async(req,res) => {
    try{
        const existingExpenses = await Expense.find({user : req.user._id});

        if(!existingExpenses || existingExpenses.length === 0){
            return res.status(200).json({
                message: 'No expenses found',
                expenses: []
            });
        }
        
        // Group expenses by year
        const yearlyExpenses = existingExpenses.reduce((acc, expense) => {
            const date = new Date(expense.date);
            const year = date.getFullYear();
            
            const yearKey = `${year}`;
            
            if (!acc[yearKey]) {
                acc[yearKey] = {
                    year: yearKey,
                    expenses: [],
                    totalAmount: 0
                };
            }
            
            acc[yearKey].expenses.push(expense);
            acc[yearKey].totalAmount += expense.amount;
            
            return acc;
        }, {});
        
        // Convert to array for easier consumption by frontend
        const yearlyExpensesArray = Object.values(yearlyExpenses);
        
        res.status(200).json({
            success: true,
            data: yearlyExpensesArray
        });
        
    } catch(err){
        console.error('Error fetching yearly expenses:', err);
        res.status(500).json({
            message: 'Error fetching yearly expenses',
            error: err.message
        });
    }
}

module.exports = { 
    getExpenses, 
    createExpense, 
    saveExpenseInternal, 
    deleteExpenseInternal,
    updateExpense, 
    deleteExpense, 
    deleteAllExpenses, 
    uploadExpensesFromCSV, 
    getMonthlyExpenses, 
    getYearlyExpenses,
    updateCategoryBudget,
    updateGlobalBudget
}