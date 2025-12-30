const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/petitions', require('./routes/petitions'));
app.use('/api/zones', require('./routes/zones'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/news', require('./routes/news'));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'EcoWatch API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EcoWatch API',
    version: '2.0.0',
    features: {
      cachedImpacts: true,
      cachedNews: true,
      backgroundJobs: true
    },
    endpoints: {
      auth: '/api/auth',
      petitions: '/api/petitions',
      zones: '/api/zones',
      ai: '/api/ai',
      news: '/api/news'
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Start server and background jobs
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 EcoWatch API Server v2.0');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log('='.repeat(60));

  // Start background jobs
  const { startNewsRefreshJob } = require('./jobs/newsRefresh');
  startNewsRefreshJob();

  console.log('✅ Background jobs initialized');
  console.log('='.repeat(60));
});

module.exports = app;
