const express = require('express');
const router = express.Router();
const { askAI } = require('../controllers/askai.controller');
const authMiddleware = require('../middleware/auth.middleware');

console.log(askAI, "askAI-checking routes");
router.use(authMiddleware);
// router.get('/ask-gemini', askGeminiController);
router.post("/ask-ai", askAI);

module.exports = router;