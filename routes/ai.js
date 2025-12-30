const express = require('express');
const router = express.Router();
const { generateZoneImpacts, getZoneImpact, askQuestion } = require('../controllers/aiController');

// Admin endpoint to generate all zone impacts
router.post('/generate-impacts', generateZoneImpacts);

// Get cached impact for specific zone
router.get('/impact/:zoneId', getZoneImpact);

// Q&A endpoint (not cached, real-time)
router.post('/ask', askQuestion);

module.exports = router;
