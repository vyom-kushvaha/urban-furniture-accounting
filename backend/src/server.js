const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Urban Furniture Accounting Backend is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/contacts', contactRoutes);

// Global 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route Not Found`,
  });
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`====================================================`);
  
  // Test PostgreSQL Database Connection
  await testConnection();
});

module.exports = app;
