// Import React hooks and styles
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // State for main search input (ingredients to include)
  const [ingredient, setIngredient] = useState("");
  // State for excluding ingredients
  const [excludeIngredient, setExcludeIngredient] = useState("");
  // State for cooking time filter
  const [timeFilter, setTimeFilter] = useState("");

  // Recipe data and UI states
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dropdown filter data
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  // 🔹 Fetch available categories and cuisines (areas) on app load
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Fetch categories
        const catRes = await fetch(
          "https://www.themealdb.com/api/json/v1/1/list.php?c=list"
        );
        const catData = await catRes.json();
        setCategories(catData.meals);

        // Fetch areas (cuisines)
        const areaRes = await fetch(
          "https://www.themealdb.com/api/json/v1/1/list.php?a=list"
        );
        const areaData = await areaRes.json();
        setAreas(areaData.meals);
      } catch (err) {
        console.log("Failed to load filters");
      }
    };
    fetchFilters();
  }, []);

  // 🔹 Fetch recipes by ingredient(s)
  const fetchRecipes = async () => {
    if (!ingredient) {
      setError("Please enter at least one ingredient.");
      return;
    }

    try {
      setError("");
      setIsLoading(true);
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`
      );
      const data = await res.json();

      if (data.meals) {
        let meals = data.meals;

        // Apply "exclude ingredient" filter (limited to 30 meals to avoid rate-limit issues)
        if (excludeIngredient) {
          const mealsToCheck = meals.slice(0, 30);
          const detailedMeals = await Promise.all(
            mealsToCheck.map(async (meal) => {
              const res = await fetch(
                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
              );
              const details = await res.json();
              return details.meals ? details.meals[0] : null;
            })
          );

          // Filter meals that do NOT include the excluded ingredient
          meals = detailedMeals.filter(
            (meal) =>
              meal &&
              !Object.values(meal)
                .join(" ")
                .toLowerCase()
                .includes(excludeIngredient.toLowerCase())
          );
        }

        // Apply "cooking time" filter (deterministic per meal ID — consistent results)
        if (timeFilter) {
          meals = meals.filter((meal) => {
            const cookTime = 15 + (parseInt(meal.idMeal) % 75); // deterministic 15–89 min
            if (timeFilter === "quick") return cookTime < 30;
            if (timeFilter === "medium") return cookTime >= 30 && cookTime <= 60;
            if (timeFilter === "long") return cookTime > 60;
            return true;
          });
        }

        // Save filtered meals
        setRecipes(meals);

        if (meals.length === 0) {
          setError("No recipes match the selected filters.");
        }
      } else {
        setRecipes([]);
        setError("No recipes found for this ingredient.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Apply category + area filters (runs whenever dropdown values change)
  useEffect(() => {
    const applyFilters = async () => {
      try {
        setError("");
        let url = "";

        // Build filter URL
        if (selectedCategory) {
          url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${selectedCategory}`;
        } else if (selectedArea) {
          url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${selectedArea}`;
        } else {
          return;
        }

        setIsLoading(true);
        const res = await fetch(url);
        const data = await res.json();
        let meals = data.meals || [];

        // If BOTH filters selected → cross-filter via detail lookup (limit to 30 to avoid N+1 overload)
        if (selectedCategory && selectedArea) {
          const mealsToCheck = meals.slice(0, 30);
          const detailedMeals = await Promise.all(
            mealsToCheck.map(async (meal) => {
              const res = await fetch(
                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
              );
              const details = await res.json();
              return details.meals ? details.meals[0] : null;
            })
          );

          meals = detailedMeals.filter(
            (meal) =>
              meal &&
              meal.strCategory === selectedCategory &&
              meal.strArea === selectedArea
          );
        }

        setRecipes(meals);
        if (meals.length === 0) {
          setError("No recipes found for the selected filters.");
        }
      } catch (err) {
        setError("Failed to apply filters.");
      } finally {
        setIsLoading(false);
      }
    };

    applyFilters();
  }, [selectedCategory, selectedArea]);

  // 🔹 Fetch recipe details (for modal view)
  const fetchRecipeDetails = async (id) => {
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
      );
      const data = await res.json();
      if (data.meals && data.meals.length > 0) {
        setSelectedRecipe(data.meals[0]);
      }
    } catch (err) {
      setError("Failed to load recipe details.");
    }
  };

  return (
    <div className="App">
      <h1>🍳 Recipe Ideas</h1>

      {/* 🔍 Search + Filters (Include/Exclude + Time) */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Enter ingredients (e.g. chicken,onion)"
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
        />
        <input
          type="text"
          placeholder="Exclude ingredient (e.g. peanuts)"
          value={excludeIngredient}
          onChange={(e) => setExcludeIngredient(e.target.value)}
        />
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="">Cooking Time</option>
          <option value="quick">Quick (&lt;30 min)</option>
          <option value="medium">Medium (30–60 min)</option>
          <option value="long">Long (&gt;60 min)</option>
        </select>
        <button onClick={fetchRecipes}>Search</button>
      </div>

      {/* 🎛 Category & Cuisine Filters */}
      <div className="filters">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Filter by Category</option>
          {categories.map((c) => (
            <option key={c.strCategory} value={c.strCategory}>
              {c.strCategory}
            </option>
          ))}
        </select>

        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
        >
          <option value="">Filter by Cuisine</option>
          {areas.map((a) => (
            <option key={a.strArea} value={a.strArea}>
              {a.strArea}
            </option>
          ))}
        </select>
      </div>

      {/* ⚠ Error Messages */}
      {error && <p className="error">{error}</p>}

      {/* 🔄 Loading Spinner */}
      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Finding delicious recipes...</p>
        </div>
      )}

      {/* 🌀 Empty State (before searching) */}
      {recipes.length === 0 && !error && !isLoading && (
        <div className="empty-state">
          <img
            src="https://cdn-icons-png.flaticon.com/512/706/706164.png"
            alt="Cooking illustration"
          />
          <h2>Discover Delicious Recipes 🍲</h2>
          <p>Enter an ingredient above and find amazing dishes to cook today!</p>
        </div>
      )}

      {/* 🥗 Recipe Cards Grid */}
      <div className="recipes">
        {recipes.map((meal) => (
          <div
            key={meal.idMeal}
            className="recipe-card"
            onClick={() => fetchRecipeDetails(meal.idMeal)}
          >
            <img src={meal.strMealThumb} alt={meal.strMeal} />
            <h3>{meal.strMeal}</h3>
          </div>
        ))}
      </div>

      {/* 🍲 Recipe Details Modal */}
      {selectedRecipe && (
        <div className="modal">
          <div className="modal-content">
            {/* Close Button */}
            <span className="close" onClick={() => setSelectedRecipe(null)}>
              &times;
            </span>

            {/* Recipe Info */}
            <h2>{selectedRecipe.strMeal}</h2>
            <img
              src={selectedRecipe.strMealThumb}
              alt={selectedRecipe.strMeal}
              className="detail-img"
            />
            <p>
              <strong>Category:</strong> {selectedRecipe.strCategory} |{" "}
              <strong>Area:</strong> {selectedRecipe.strArea}
            </p>

            {/* Ingredients List */}
            <h3>Ingredients:</h3>
            <ul>
              {Array.from({ length: 20 }, (_, i) => i + 1)
                .map((i) => ({
                  ingredient: selectedRecipe[`strIngredient${i}`],
                  measure: selectedRecipe[`strMeasure${i}`],
                }))
                .filter((item) => item.ingredient && item.ingredient.trim())
                .map((item, index) => (
                  <li key={index}>
                    {item.ingredient} - {item.measure}
                  </li>
                ))}
            </ul>

            {/* Instructions */}
            <h3>Instructions:</h3>
            <p>{selectedRecipe.strInstructions}</p>

            {/* Optional YouTube Link */}
            {selectedRecipe.strYoutube && (
              <p>
                <a
                  href={selectedRecipe.strYoutube}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📺 Watch on YouTube
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
