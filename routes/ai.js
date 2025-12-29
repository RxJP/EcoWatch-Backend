const express = require('express');
const router = express.Router();
const { analyzeImpact, askQuestion } = require('../controllers/aiController');

router.post('/analyze', analyzeImpact);
router.post('/ask', askQuestion);

module.exports = router;
