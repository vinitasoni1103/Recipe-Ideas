import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [ingredient, setIngredient] = useState("");

  const [excludeIngredient, setExcludeIngredient] = useState("");

  const [timeFilter, setTimeFilter] = useState("");

  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

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

      // Step 1: Try filtering by ingredient name
      let res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`
      );
      let data = await res.json();
      let fromNameSearch = false;

      // Step 2: Fallback — search by meal name if no ingredient match found
      // (e.g. "pasta" is not an exact MealDB ingredient but IS in meal titles)
      if (!data.meals) {
        res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/search.php?s=${ingredient}`
        );
        data = await res.json();
        fromNameSearch = true;
      }

      if (data.meals) {
        let meals = data.meals;

        // Apply "exclude ingredient" filter
        if (excludeIngredient) {
          if (!fromNameSearch) {
            // filter.php returns minimal fields only — need detail lookups (capped at 30)
            const mealsToCheck = meals.slice(0, 30);
            const detailedMeals = await Promise.all(
              mealsToCheck.map(async (meal) => {
                const r = await fetch(
                  `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
                );
                const details = await r.json();
                return details.meals ? details.meals[0] : null;
              })
            );
            meals = detailedMeals.filter(
              (meal) =>
                meal &&
                !Object.values(meal)
                  .join(" ")
                  .toLowerCase()
                  .includes(excludeIngredient.toLowerCase())
            );
          } else {
            // search.php already returns full meal details — check directly, no extra calls
            meals = meals.filter(
              (meal) =>
                !Object.values(meal)
                  .join(" ")
                  .toLowerCase()
                  .includes(excludeIngredient.toLowerCase())
            );
          }
        }

        // Apply "cooking time" filter (deterministic per meal ID — 15–89 min range)
        if (timeFilter) {
          meals = meals.filter((meal) => {
            const cookTime = 15 + (parseInt(meal.idMeal) % 75);
            if (timeFilter === "quick") return cookTime < 30;
            if (timeFilter === "medium") return cookTime >= 30 && cookTime <= 60;
            if (timeFilter === "long") return cookTime > 60;
            return true;
          });
        }

        // Apply area filter via Set intersection (fast, no extra API calls)
        if (selectedArea) {
          const areaRes = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?a=${selectedArea}`
          );
          const areaData = await areaRes.json();
          if (areaData.meals) {
            const areaIds = new Set(areaData.meals.map((m) => m.idMeal));
            meals = meals.filter((m) => areaIds.has(m.idMeal));
          } else {
            meals = [];
          }
        }

        // Apply category filter via Set intersection (fast, no extra API calls)
        if (selectedCategory) {
          const catRes = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?c=${selectedCategory}`
          );
          const catData = await catRes.json();
          if (catData.meals) {
            const catIds = new Set(catData.meals.map((m) => m.idMeal));
            meals = meals.filter((m) => catIds.has(m.idMeal));
          } else {
            meals = [];
          }
        }

        setRecipes(meals);
        if (meals.length === 0) {
          setError("No recipes match the selected filters.");
        }
      } else {
        setRecipes([]);
        setError("No recipes found. Try a different ingredient or dish name.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Apply category + area filters (only when no ingredient is typed)
  // When ingredient IS typed, the Search button handles all filters together.
  useEffect(() => {
    const applyFilters = async () => {
      // Don't compete with ingredient search — let fetchRecipes handle everything
      if (ingredient) return;

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

        // If BOTH filters selected → intersect using a second Set fetch (no N+1)
        if (selectedCategory && selectedArea) {
          const areaRes = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?a=${selectedArea}`
          );
          const areaData = await areaRes.json();
          if (areaData.meals) {
            const areaIds = new Set(areaData.meals.map((m) => m.idMeal));
            meals = meals.filter((m) => areaIds.has(m.idMeal));
          } else {
            meals = [];
          }
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
  }, [selectedCategory, selectedArea, ingredient]);

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
