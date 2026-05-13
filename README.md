# 🍳 Recipe Ideas (User's Kitchen Helper)

🌐 **Live Demo**  
CodeSandbox/StackBlitz: https://recipeeideas.netlify.app/  

A lightweight React app that helps User decide what to cook based on **what’s on hand**, **mood**, and **time**.

## ✨ Features
- **Include ingredients** (comma-separated) → find matching meals
- **Exclude ingredient** → filter out unwanted items (e.g., peanuts)
- **Cooking time filter** → Quick (<30m), Medium (30–60m), Long (>60m) *(mocked)*
- **Category & Cuisine filters** → work independently and together
- **Recipe details modal** → ingredients, instructions, category, area, YouTube link
- **Responsive UI** → clean grid + polished modal
- **Error handling** → friendly messages for empty/no results/network issues

---

## 🧰 Tech Stack
- **React** (Create React App)
- **CSS** (plain `App.css`)
- **State:** React `useState`, `useEffect`
- **Fetch:** native `fetch`
- **API:** [TheMealDB](https://www.themealdb.com/)

---

## 🔌 API Endpoints Used
- List Categories: `list.php?c=list`
- List Areas: `list.php?a=list`
- Filter by Ingredient(s): `filter.php?i={commaSeparatedIngredients}`
- Filter by Category: `filter.php?c={category}`
- Filter by Area: `filter.php?a={area}`
- Lookup Details: `lookup.php?i={idMeal}`

---

🧪 **Testing Checklist**  
- Ingredient search `chicken,onion` returns results  
- Exclude `rice` removes matching meals  
- Category + Cuisine together narrow results  
- Time filter changes results (mocked)  
- Modal opens, shows details & YouTube link  
- Errors: empty input / no results / network → friendly messages  
- Mobile layout remains usable  

---

📝 **Design & Decisions**  
- Combined filters: API doesn’t support direct AND queries → we fetch one filter then refine locally by fetching details.  
- Time filter: API lacks cook time → we mock a time range per meal (documented as a limitation).  
- Simplicity: Used plain CSS for clarity; minimal dependencies.  

---

⚠️ **Limitations**  
- Cook time is simulated (not API-driven).  
- Ingredient presence check is based on detailed meal fields returned by TheMealDB.  

---

🗺️ **Future Improvements**  
- Persist favorites (localStorage)  
- Pagination / infinite scroll  
- Real cook-time metadata from another source  
- Multi-select chips for include/exclude with clear UX  

---

📎 **Working with AI**  
Conversation link: https://chatgpt.com/c/68b0b720-700c-8326-a5a6-06f649429a05 

---

## Updates in Latest Version
- Improved **UI/UX**:
  - Modern gradient background and polished recipe cards
  - Enhanced modal with blur effect, shadows, and animations
  - Added **empty state illustration** for better first-time user experience
- Improved **Responsive Design** for mobile, tablet, and desktop.

## 🚀 Getting Started (Local)
```bash
git clone <your-repo-url>
cd recipe-ideas
npm install
npm start


