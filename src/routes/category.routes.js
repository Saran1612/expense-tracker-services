const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory, deleteAllCategories } = require('../controllers/category.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply auth middleware to all category routes
router.use(authMiddleware);

router.get('/:id?', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.delete('/', deleteAllCategories);

module.exports = router;