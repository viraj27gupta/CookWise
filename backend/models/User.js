const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true  // No duplicate emails
  },
  password: {
    type: String,
    required: true
  },
  dietaryPreferences: [{
    type: String  // e.g., "vegan", "keto", "gluten-free"
  }],
  allergies: [{
    type: String  // e.g., "peanuts", "dairy"
  }],
  favoriteRecipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'  // Links to Recipe model
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
