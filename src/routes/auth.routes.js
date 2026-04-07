const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getCurrentUser, updateUser } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/me', authMiddleware, getCurrentUser);
router.put('/update', authMiddleware, updateUser);

module.exports = router;