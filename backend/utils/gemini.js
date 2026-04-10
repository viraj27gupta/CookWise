const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateRecipe(ingredients, preferences = {}, isRecipeSearch = false) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: { temperature: 1.0 } // Max creativity for variety
    });

    // Add randomness to force different recipes each time
    const randomSeed = Math.random();
    const cookingStyles = ['simple', 'gourmet', 'quick', 'slow-cooked', 'pan-fried', 'baked', 'grilled', 'steamed'];
    const randomStyle = cookingStyles[Math.floor(Math.random() * cookingStyles.length)];

    let prompt = '';

    if (isRecipeSearch) {
      // Recipe name/search mode
      const recipeName = ingredients[0];
      const cuisineInfo = preferences.cuisine && preferences.cuisine !== 'Any'
        ? `Create an AUTHENTIC, TRADITIONAL ${preferences.cuisine} version of ${recipeName}`
        : `Create a delicious recipe for ${recipeName}`;

      prompt = `
        ${cuisineInfo}.

        Style: ${randomStyle}
        Random seed: ${randomSeed}

        Preferences:
        - Dietary: ${preferences.dietary || 'None'}
        - Allergies: ${preferences.allergies || 'None'}
        - Cuisine: ${preferences.cuisine || 'Any Cuisine'}
        - Cook time: ${preferences.cookTime || '30'} minutes
        - Servings: ${preferences.servings || '2'}

        IMPORTANT: Create an AUTHENTIC and TRADITIONAL recipe for this dish. Use proper ingredients and techniques.

        Return ONLY a JSON object with this format (no markdown, no extra text):
        {
          "title": "Recipe name",
          "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
          "instructions": "Detailed step by step instructions",
          "cookTime": 30,
          "servings": 2,
          "difficulty": "easy"
        }
      `;
    } else {
      // Ingredients mode
      const cuisineInfo = preferences.cuisine && preferences.cuisine !== 'Any'
        ? `Create an AUTHENTIC, TRADITIONAL ${preferences.cuisine} cuisine recipe`
        : 'Create a delicious recipe';

      prompt = `
        ${cuisineInfo} using ONLY these ingredients: ${ingredients.join(', ')}.

        CRITICAL CONSTRAINTS:
        - Start with the provided ingredients as the BASE
        - You MUST add appropriate spices and seasonings for this cuisine (e.g., for Indian: cumin, coriander, turmeric, garam masala, cardamom, cinnamon, cloves, bay leaves, ginger, garlic, chili etc.)
        - Some ingredients may include quantities. Use these exact amounts.
        - Create a FULL, AUTHENTIC recipe with all necessary ingredients for the cuisine

        Style: ${randomStyle}
        Random seed: ${randomSeed}

        Preferences:
        - Dietary: ${preferences.dietary || 'None'}
        - Allergies: ${preferences.allergies || 'None'}
        - Cuisine: ${preferences.cuisine || 'Any Cuisine'}
        - Cook time: ${preferences.cookTime || '30'} minutes
        - Servings: ${preferences.servings || '2'}

        IMPORTANT: Be CREATIVE and ORIGINAL. Generate a completely DIFFERENT recipe from previous ones. Use traditional cooking techniques. STRICT: Only use the provided ingredients!

        Return ONLY a JSON object with this format (no markdown, no extra text):
        {
          "title": "Recipe name",
          "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
          "instructions": "Detailed step by step instructions",
          "cookTime": 30,
          "servings": 2,
          "difficulty": "easy"
        }
      `;
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON from the response
    const recipe = JSON.parse(text);

    return recipe;
  } catch (err) {
    console.error('❌ Gemini API error:', err.message);

    // Handle specific API errors with user-friendly messages
    if (err.message.includes('503') || err.message.includes('Service Unavailable')) {
      throw new Error('The AI service is currently busy. Please try again in a moment.');
    }
    if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      throw new Error('API authentication failed. Please check your API key.');
    }
    if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }

    throw new Error('Unable to generate recipe. Please try again.');
  }
}

module.exports = { generateRecipe };
