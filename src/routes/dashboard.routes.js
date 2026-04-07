const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { getDashboardData } = require('../controllers/dashboard.controller');

router.use(authMiddleware);
router.get('/', getDashboardData);

module.exports = router;