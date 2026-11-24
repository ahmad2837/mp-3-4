// =====================================================
// Product Explorer - MP3 + MP4
// Data comes from the DummyJSON API: https://dummyjson.com/products
// =====================================================

// ---------- 1. Select HTML elements (DOM selectors) ----------
const searchInput = document.querySelector("#searchInput");
const categorySelect = document.querySelector("#categorySelect");
const sortSelect = document.querySelector("#sortSelect");
const favoritesToggle = document.querySelector("#favoritesToggle");
const productGrid = document.querySelector("#productGrid");
const resultCount = document.querySelector("#resultCount");
const loadingBox = document.querySelector("#loading");
const errorBox = document.querySelector("#error");
const errorMessage = document.querySelector("#errorMessage");
const emptyBox = document.querySelector("#empty");
const retryBtn = document.querySelector("#retryBtn");

// ---------- 2. Application data (arrays and variables) ----------
let allProducts = [];          // all products from the API
let showOnlyFavorites = false; // is the "Show Favorites" mode on?

// Local Storage: load saved favorite product IDs (an array of numbers).
// If nothing is saved yet, start with an empty array.
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// ---------- 3. Fetch data from the API (async/await) ----------
async function fetchProducts() {
  showLoading();

  try {
    const response = await fetch("https://dummyjson.com/products?limit=100");

    // fetch does not throw on HTTP errors, so we check manually
    if (!response.ok) {
      throw new Error("Server error: " + response.status);
    }

    const data = await response.json();
    allProducts = data.products;

    fillCategories();
    hideStatusBoxes();
    updateDisplay();
  } catch (error) {
    showError("Could not load products. Please check your internet and try again.");
    console.error(error);
  }
}

// ---------- 4. Loading / error / empty states ----------
function hideStatusBoxes() {
  loadingBox.classList.add("hidden");
  errorBox.classList.add("hidden");
  emptyBox.classList.add("hidden");
}

function showLoading() {
  hideStatusBoxes();
  productGrid.innerHTML = "";
  resultCount.textContent = "";
  loadingBox.classList.remove("hidden");
}

function showError(message) {
  hideStatusBoxes();
  errorMessage.textContent = message;
  errorBox.classList.remove("hidden");
}

// ---------- 5. Fill the category dropdown from the data ----------
function fillCategories() {
  // map() collects every category, Set removes duplicates
  const categories = [...new Set(allProducts.map(function (p) {
    return p.category;
  }))];

  // forEach() creates one <option> per category
  categories.forEach(function (category) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// ---------- 6. Search + filter + sort (array methods) ----------
function getVisibleProducts() {
  const searchText = searchInput.value.toLowerCase().trim();
  const category = categorySelect.value;
  const sortType = sortSelect.value;

  // filter(): keep only products that match all conditions
  let result = allProducts.filter(function (product) {
    const matchesSearch = product.title.toLowerCase().includes(searchText);
    const matchesCategory = category === "all" || product.category === category;
    const matchesFavorite = !showOnlyFavorites || favorites.includes(product.id);
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  // sort(): order the results (on a copy so the original is not changed)
  if (sortType === "price-low") {
    result.sort(function (a, b) { return a.price - b.price; });
  } else if (sortType === "price-high") {
    result.sort(function (a, b) { return b.price - a.price; });
  } else if (sortType === "rating") {
    result.sort(function (a, b) { return b.rating - a.rating; });
  }

  return result;
}

// ---------- 7. Show the products on the page (DOM rendering) ----------
function displayProducts(products) {
  productGrid.innerHTML = ""; // clear old cards

  products.forEach(function (product) {
    const isFavorite = favorites.includes(product.id);

    // create a card element for each product
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML =
      '<img src="' + product.thumbnail + '" alt="' + product.title + '">' +
      "<h3>" + product.title + "</h3>" +
      '<p class="category">' + product.category + "</p>" +
      '<p class="price">$' + product.price + "</p>" +
      '<p class="rating">⭐ ' + product.rating + "</p>" +
      '<button class="fav-btn ' + (isFavorite ? "saved" : "") + '" data-id="' + product.id + '">' +
      (isFavorite ? "❤️ Saved" : "🤍 Save") +
      "</button>";

    productGrid.appendChild(card);
  });
}

// Runs every time the user changes search, filter, sort or favorites
function updateDisplay() {
  const products = getVisibleProducts();

  displayProducts(products);
  resultCount.textContent = "Showing " + products.length + " product(s)";

  // Empty state: nothing matched
  if (products.length === 0) {
    emptyBox.classList.remove("hidden");
  } else {
    emptyBox.classList.add("hidden");
  }

  updateFavoritesButton();
}

// ---------- 8. Local Storage: save / remove favorites ----------
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    // remove the id from the array
    favorites = favorites.filter(function (favId) {
      return favId !== id;
    });
  } else {
    favorites.push(id);
  }

  // Save the updated array. localStorage only stores text, so use JSON.stringify
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateDisplay();
}

function updateFavoritesButton() {
  const label = showOnlyFavorites ? "Show All" : "Show Favorites";
  favoritesToggle.textContent = "❤️ " + label + " (" + favorites.length + ")";
  favoritesToggle.classList.toggle("active", showOnlyFavorites);
}

// ---------- 9. Event listeners (addEventListener) ----------
// Typing in the search box
searchInput.addEventListener("input", updateDisplay);

// Changing category or sort option
categorySelect.addEventListener("change", updateDisplay);
sortSelect.addEventListener("change", updateDisplay);

// Show favorites / show all
favoritesToggle.addEventListener("click", function () {
  showOnlyFavorites = !showOnlyFavorites;
  updateDisplay();
});

// Retry button after an error
retryBtn.addEventListener("click", fetchProducts);

// Event delegation: one listener on the grid handles every Save button
productGrid.addEventListener("click", function (event) {
  const button = event.target.closest(".fav-btn");
  if (button) {
    toggleFavorite(Number(button.dataset.id));
  }
});

// ---------- 10. Start the app ----------
fetchProducts();
