const express = require('express');
const router = express.Router();
const { getNews, refreshNewsCache } = require('../controllers/newsController');

// Get cached news (public)
router.get('/', getNews);

// Manual refresh (admin)
router.post('/refresh', refreshNewsCache);

module.exports = router;
