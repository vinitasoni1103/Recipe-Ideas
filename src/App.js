import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [ingredient, setIngredient] = useState("");
  const [excludeIngredient, setExcludeIngredient] = useState("");
  const [timeFilter, setTimeFilter] = useState("");

  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  // Fetch categories and areas on load
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const catRes = await fetch(
          "https://www.themealdb.com/api/json/v1/1/list.php?c=list"
        );
        const catData = await catRes.json();
        setCategories(catData.meals);

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

  // Fetch recipes by ingredients
  const fetchRecipes = async () => {
    if (!ingredient) {
      setError("Please enter at least one ingredient.");
      return;
    }

    try {
      setError("");
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`
      );
      const data = await res.json();

      if (data.meals) {
        let meals = data.meals;

        // Apply exclude filter (remove meals that contain excluded ingredient)
        if (excludeIngredient) {
          const detailedMeals = await Promise.all(
            meals.map(async (meal) => {
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
              !Object.values(meal)
                .join(" ")
                .toLowerCase()
                .includes(excludeIngredient.toLowerCase())
          );
        }

        // Apply time filter (mocked)
        if (timeFilter) {
          meals = meals.filter((meal) => {
            // Assign random time (20–90 mins) for mock
            const cookTime = 20 + Math.floor(Math.random() * 70);
            if (timeFilter === "quick") return cookTime < 30;
            if (timeFilter === "medium") return cookTime >= 30 && cookTime <= 60;
            if (timeFilter === "long") return cookTime > 60;
            return true;
          });
        }

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
    }
  };

  // Apply category/area filter combined
  useEffect(() => {
    const applyFilters = async () => {
      try {
        setError("");
        let url = "";

        if (selectedCategory) {
          url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${selectedCategory}`;
        } else if (selectedArea) {
          url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${selectedArea}`;
        } else {
          return;
        }

        const res = await fetch(url);
        const data = await res.json();
        let meals = data.meals || [];

        // If both filters are chosen, refine manually
        if (selectedCategory && selectedArea) {
          const detailedMeals = await Promise.all(
            meals.map(async (meal) => {
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
      } catch (err) {
        setError("Failed to apply filters.");
      }
    };

    applyFilters();
  }, [selectedCategory, selectedArea]);

  // Fetch recipe details by ID
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

      {/* Search + Filters */}
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

      {/* Filters */}
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

      {/* Error Message */}
      {error && <p className="error">{error}</p>}

      {/* Recipes List */}
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

      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setSelectedRecipe(null)}>
              &times;
            </span>
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
            <h3>Instructions:</h3>
            <p>{selectedRecipe.strInstructions}</p>
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
