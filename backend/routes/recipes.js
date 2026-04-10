const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { generateRecipe } = require('../utils/gemini');

// GET: Fetch all recipes
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find().limit(10);
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch a single recipe by ID
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Save a recipe as favorite
router.post('/:id/favorite', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Add recipe to favorites if not already there
    if (!user.favoriteRecipes.includes(req.params.id)) {
      user.favoriteRecipes.push(req.params.id);
      await user.save();
    }

    res.json({ message: 'Recipe saved to favorites', favorites: user.favoriteRecipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create a new recipe
router.post('/', async (req, res) => {
  try {
    const { title, ingredients, instructions, cookTime, servings, dietary, difficulty } = req.body;

    const recipe = new Recipe({
      title,
      ingredients,
      instructions,
      cookTime,
      servings,
      dietary,
      difficulty
    });

    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST: Generate recipe using Gemini AI
router.post('/generate', async (req, res) => {
  try {
    const { ingredients, preferences } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one ingredient' });
    }

    // Generate recipe using Gemini
    const recipe = await generateRecipe(ingredients, preferences);

    // Save to database
    const newRecipe = new Recipe({
      ...recipe,
      userId: preferences?.userId || null
    });

    await newRecipe.save();

    res.status(201).json(newRecipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Search for a recipe by name
router.post('/search', async (req, res) => {
  try {
    const { recipeName, preferences } = req.body;

    if (!recipeName || recipeName.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a recipe name' });
    }

    // Generate recipe using Gemini (by name)
    const recipe = await generateRecipe([recipeName], preferences, true);

    // Save to database
    const newRecipe = new Recipe({
      ...recipe,
      userId: preferences?.userId || null
    });

    await newRecipe.save();

    res.status(201).json(newRecipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
