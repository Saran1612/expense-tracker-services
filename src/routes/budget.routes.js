const express = require('express');
const router = express.Router();
const { getBudget, createCategoryBudget , createGlobalBudget, deleteBudget} = require('../controllers/budget.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', getBudget);
router.post('/global', createGlobalBudget);
router.post('/category', createCategoryBudget);
router.delete('/:id?', deleteBudget);
// router.put('/:id', updateBudget);

module.exports = router;