# 🍳 Recipe Ideas (Taylor’s Kitchen Helper)

A lightweight React app that helps Taylor decide what to cook based on **what’s on hand**, **mood**, and **time**.

## ✨ Features
- **Include ingredients** (comma-separated) → find matching meals
- **Exclude ingredient** → filter out unwanted items (e.g., peanuts)
- **Cooking time filter** → Quick (<30m), Medium (30–60m), Long (>60m) *(mocked)*
- **Category & Cuisine filters** → work independently and together
- **Recipe details modal** → ingredients, instructions, category, area, YouTube link
- **Responsive UI** → clean grid + polished modal
- **Error handling** → friendly messages for empty/no results/network issues

## 🧰 Tech Stack
- **React** (Create React App)
- **CSS** (plain `App.css`)
- **State:** React `useState`, `useEffect`
- **Fetch:** native `fetch`
- **API:** [TheMealDB](https://www.themealdb.com/)

## 🔌 API Endpoints Used
- List Categories: `list.php?c=list`
- List Areas: `list.php?a=list`
- Filter by Ingredient(s): `filter.php?i={commaSeparatedIngredients}`
- Filter by Category: `filter.php?c={category}`
- Filter by Area: `filter.php?a={area}`
- Lookup Details: `lookup.php?i={idMeal}`

## 🚀 Getting Started (Local)
```bash
git clone <your-repo-url>
cd recipe-ideas
npm install
npm start
