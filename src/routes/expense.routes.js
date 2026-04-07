const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getExpenses, createExpense, updateExpense, deleteExpense, deleteAllExpenses, uploadExpensesFromCSV , getMonthlyExpenses, getYearlyExpenses} = require('../controllers/expense.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Apply auth middleware to all category routes
router.use(authMiddleware);
router.get('/monthly',getMonthlyExpenses)
router.get('/yearly',getYearlyExpenses);
router.post('/', createExpense);
router.post('/upload-csv', upload.single('file'), uploadExpensesFromCSV);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.delete('/', deleteAllExpenses);
router.get('/:category?/:tags?/:startDate?/:endDate?', getExpenses);


module.exports = router;