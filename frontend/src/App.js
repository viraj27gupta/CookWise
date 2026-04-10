import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = `http://${window.location.hostname}:5001`;

function App() {
  const [mode, setMode] = useState('ingredients'); // 'ingredients' or 'search'
  const [ingredients, setIngredients] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState('2');
  const [cuisine, setCuisine] = useState('');
  const [recipe, setRecipe] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [lockedIngredients, setLockedIngredients] = useState([]);
  const [showAdjustMode, setShowAdjustMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateRecipe = async (e) => {
    e.preventDefault();

    if (!ingredients.trim()) {
      setError('Please enter at least one ingredient');
      return;
    }

    setLoading(true);
    setError('');
    setRecipe(null);

    try {
      const ingredientList = ingredients.split(',').map(i => i.trim());

      const response = await axios.post(`${API_URL}/recipes/generate`, {
        ingredients: ingredientList,
        preferences: {
          servings: parseInt(servings),
          cuisine: cuisine || 'Any'
        }
      });

      setRecipe(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRecipe = async (e) => {
    e.preventDefault();

    if (!recipeName.trim()) {
      setError('Please enter a recipe name');
      return;
    }

    setLoading(true);
    setError('');
    setRecipe(null);

    try {
      const response = await axios.post(`${API_URL}/recipes/search`, {
        recipeName: recipeName,
        preferences: {
          servings: parseInt(servings),
          cuisine: cuisine || 'Any'
        }
      });

      setRecipe(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleShowAdjustMode = () => {
    if (recipe) {
      // Get original input ingredients (lowercase for comparison)
      const originalIngs = ingredients.split(',').map(i => i.trim().toLowerCase());

      // Get basic pantry items
      const basicItems = ['oil', 'salt', 'pepper', 'water', 'butter'];

      // Find recipe ingredients that match original or basic items
      const locked = recipe.ingredients.filter(recipeIng => {
        const recipeIngLower = recipeIng.toLowerCase();

        // Check if it's a basic item
        const isBasic = basicItems.some(item => recipeIngLower.includes(item));

        // Check if it's an original ingredient (flexible matching)
        const isOriginal = originalIngs.some(orig =>
          recipeIngLower.includes(orig) || orig.includes(recipeIngLower.split(' ')[0])
        );

        return isBasic || isOriginal;
      });

      setSelectedIngredients(locked);
      setLockedIngredients(locked);
      setShowAdjustMode(true);
    }
  };

  const handleRegenerateWithSelected = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/recipes/generate`, {
        ingredients: selectedIngredients,
        preferences: {
          servings: parseInt(servings),
          cuisine: cuisine || 'Any'
        }
      });

      setRecipe(response.data);
      setShowAdjustMode(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🍳 CookWise AI</h1>
        <p>AI-powered recipe recommendations</p>
      </header>

      <main className="container">
        <div className="tabs">
          <button
            className={`tab-button ${mode === 'ingredients' ? 'active' : ''}`}
            onClick={() => { setMode('ingredients'); setRecipe(null); setError(''); }}
          >
            🥘 By Ingredients
          </button>
          <button
            className={`tab-button ${mode === 'search' ? 'active' : ''}`}
            onClick={() => { setMode('search'); setRecipe(null); setError(''); }}
          >
            🔍 Ask for Recipe
          </button>
        </div>

        <form onSubmit={mode === 'ingredients' ? handleGenerateRecipe : handleSearchRecipe} className="form">
          {mode === 'ingredients' ? (
            <div className="input-group">
              <input
                type="text"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Enter ingredients separated by commas (e.g., chicken, tomato, garlic)"
                className="input"
                disabled={loading}
              />
              <button type="submit" className="button" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Recipe'}
              </button>
            </div>
          ) : (
            <div className="input-group">
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="e.g., Butter Chicken, Spaghetti Carbonara, Pad Thai"
                className="input"
                disabled={loading}
              />
              <button type="submit" className="button" disabled={loading}>
                {loading ? 'Finding...' : 'Find Recipe'}
              </button>
            </div>
          )}

          <div className="options-group">
            <div className="option-field">
              <label>Servings</label>
              <input
                type="number"
                min="1"
                max="10"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="input-small"
                disabled={loading}
              />
            </div>

            {mode === 'ingredients' && (
              <div className="option-field">
                <label>Cuisine (Optional)</label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="input-small"
                  disabled={loading}
                >
                  <option value="">Any</option>
                  <option value="Italian">Italian</option>
                  <option value="Asian">Asian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Indian">Indian</option>
                  <option value="American">American</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Thai">Thai</option>
                </select>
              </div>
            )}
          </div>
        </form>

        {error && <div className="error">{error}</div>}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Creating your perfect recipe...</p>
          </div>
        )}

        {recipe && (
          <div className="recipe">
            <h2>{recipe.title}</h2>
            
            <div className="recipe-meta">
              <span>⏱️ {recipe.cookTime} min</span>
              <span>👥 {recipe.servings} servings</span>
              <span>📊 {recipe.difficulty}</span>
            </div>

            <div className="recipe-section">
              <h3>Ingredients</h3>
              <ul>
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx}>{ingredient}</li>
                ))}
              </ul>
            </div>

            <div className="recipe-section">
              <h3>Instructions</h3>
              <ol className="instructions-list">
                {recipe.instructions.split(/\d+\.\s+/).filter(Boolean).map((step, idx) => (
                  <li key={idx}>{step.trim()}</li>
                ))}
              </ol>
            </div>

            {showAdjustMode && (
              <div className="adjust-ingredients">
                <h3>📝 Adjust Ingredients</h3>
                <p>Select the ingredients you have, then regenerate the recipe</p>
                <div className="ingredients-checklist">
                  {recipe.ingredients.map((ingredient, idx) => {
                    const isLocked = lockedIngredients.includes(ingredient);
                    const isSelected = selectedIngredients.includes(ingredient);

                    return (
                      <label
                        key={idx}
                        className={`checkbox-item ${isLocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isLocked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIngredients([...selectedIngredients, ingredient]);
                            } else {
                              setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient));
                            }
                          }}
                        />
                        <span>
                          {ingredient}
                          {isLocked && <span className="lock-badge">✓ Fixed</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="adjust-actions">
                  <button
                    type="button"
                    onClick={handleRegenerateWithSelected}
                    className="button"
                    disabled={loading || selectedIngredients.length === 0}
                  >
                    {loading ? 'Regenerating...' : '🔄 Regenerate with Selected'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdjustMode(false)}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!showAdjustMode && (
              <div className="recipe-actions">
                <button className="button-secondary">❤️ Save to Favorites</button>
                {mode === 'ingredients' && (
                  <>
                    <button
                      type="button"
                      onClick={handleShowAdjustMode}
                      className="button-secondary"
                    >
                      ✏️ Adjust Ingredients
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateRecipe}
                      className="button-secondary"
                      disabled={loading}
                    >
                      🔄 Get Another Recipe
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
