const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected!'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Connect to Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('❌ Redis connection error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected!'));
redisClient.connect();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Import routes
const recipeRoutes = require('./routes/recipes');

// Use routes
app.use('/recipes', recipeRoutes);

// Health check route (useful for testing)
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running! 🚀' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
