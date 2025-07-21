/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const productSearch = document.getElementById("productSearch");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div> 
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Store selected products by their IDs */
let selectedProductIds = [];

// Load selected products from localStorage
function loadSelectedProductIds() {
  const saved = localStorage.getItem("selectedProductIds");
  if (saved) {
    try {
      selectedProductIds = JSON.parse(saved);
    } catch {
      selectedProductIds = [];
    }
  }
}

// Save selected products to localStorage
function saveSelectedProductIds() {
  localStorage.setItem("selectedProductIds", JSON.stringify(selectedProductIds));
}

/* Helper: Get product by ID from products array */
function getProductById(products, id) {
  return products.find((p) => p.id === id);
}

/* Display selected products in the list */
function updateSelectedProductsList(products) {
  const selectedProductsList = document.getElementById("selectedProductsList");
  if (selectedProductIds.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected yet.</div>`;
    return;
  }
  selectedProductsList.innerHTML = selectedProductIds
    .map((id) => {
      const product = getProductById(products, id);
      return `
        <div class="selected-product-item" data-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" width="32" height="32" style="border-radius:4px;">
          <span>${product.name}</span>
          <button class="selected-product-remove" title="Remove" aria-label="Remove ${product.name}">&times;</button>
        </div>
      `;
    })
    .join("");
  // Add "Clear All" button
  selectedProductsList.innerHTML += `
    <button id="clearSelectedProducts" class="generate-btn" style="margin-top:10px;background:#e3a535;color:#fff;">
      <i class="fa-solid fa-trash"></i> Clear All
    </button>
  `;
}

/* Create HTML for displaying product cards with selection logic and description */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card${selectedProductIds.includes(product.id) ? " selected" : ""}${product.expanded ? " expanded" : ""}" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="product-description-toggle" type="button" aria-expanded="${product.expanded ? "true" : "false"}">Show Description</button>
        <div class="product-description-expanded" ${product.expanded ? "" : 'style="display:none;"'}>
          ${product.description}
        </div>
      </div>
      <div class="product-description-overlay" aria-hidden="true">
        ${product.description}
      </div>
    </div>
  `
    )
    .join("");

  // Add click event listeners for selection
  document.querySelectorAll(".product-card").forEach((card, idx) => {
    card.addEventListener("click", (event) => {
      if (event.target.classList.contains("product-description-toggle")) return;
      const id = Number(card.getAttribute("data-id"));
      if (selectedProductIds.includes(id)) {
        selectedProductIds = selectedProductIds.filter((pid) => pid !== id);
      } else {
        selectedProductIds.push(id);
      }
      saveSelectedProductIds();
      displayProducts(products);
      updateSelectedProductsList(products);
    });

    // Description toggle button logic (for mobile/focus)
    const toggleBtn = card.querySelector(".product-description-toggle");
    toggleBtn.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent card selection
      const id = Number(card.getAttribute("data-id"));
      // Toggle expanded property for this product
      products.forEach((p) => {
        if (p.id === id) {
          p.expanded = !p.expanded;
        } else {
          p.expanded = false; // Only one expanded at a time
        }
      });
      displayProducts(products);
      updateSelectedProductsList(products);
    });
  });
}

/* Track current filter state */
let currentCategory = "";
let currentSearch = "";

/* Helper: Filter products by category and search keyword */
function getFilteredProducts(products) {
  return products.filter((product) => {
    // Category filter
    const matchesCategory = currentCategory
      ? product.category === currentCategory
      : true;
    // Search filter (name or description)
    const searchTerm = currentSearch.trim().toLowerCase();
    const matchesSearch =
      searchTerm &&
      (product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm));
    return matchesCategory && (currentSearch ? matchesSearch : true);
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  currentCategory = e.target.value;
  const products = await loadProducts();
  const filteredProducts = getFilteredProducts(products);
  displayProducts(filteredProducts);
  updateSelectedProductsList(products);

  // Remove buttons for selected products
  document.getElementById("selectedProductsList").addEventListener("click", function (event) {
    if (event.target.classList.contains("selected-product-remove")) {
      const item = event.target.closest(".selected-product-item");
      const id = Number(item.getAttribute("data-id"));
      selectedProductIds = selectedProductIds.filter((pid) => pid !== id);
      saveSelectedProductIds();
      displayProducts(filteredProducts);
      updateSelectedProductsList(filteredProducts);
    }
    // Clear all selections
    if (event.target.id === "clearSelectedProducts" || event.target.closest("#clearSelectedProducts")) {
      selectedProductIds = [];
      saveSelectedProductIds();
      displayProducts(filteredProducts);
      updateSelectedProductsList(filteredProducts);
    }
  });
});

/* Listen for input in the product search field */
productSearch.addEventListener("input", async (e) => {
  currentSearch = e.target.value;
  const products = await loadProducts();
  const filteredProducts = getFilteredProducts(products);
  displayProducts(filteredProducts);
  updateSelectedProductsList(products);

  document.getElementById("selectedProductsList").addEventListener("click", function (event) {
    if (event.target.classList.contains("selected-product-remove")) {
      const item = event.target.closest(".selected-product-item");
      const id = Number(item.getAttribute("data-id"));
      selectedProductIds = selectedProductIds.filter((pid) => pid !== id);
      saveSelectedProductIds();
      displayProducts(filteredProducts);
      updateSelectedProductsList(filteredProducts);
    }
    // Clear all selections
    if (event.target.id === "clearSelectedProducts" || event.target.closest("#clearSelectedProducts")) {
      selectedProductIds = [];
      saveSelectedProductIds();
      displayProducts(filteredProducts);
      updateSelectedProductsList(filteredProducts);
    }
  });
});

/* On initial load, show all products (no filter) */
loadSelectedProductIds();
loadProducts().then((products) => {
  displayProducts(getFilteredProducts(products));
  updateSelectedProductsList(products);
});

/* Store chat history for follow-up questions */
let chatHistory = [];

// Get reference to the "Generate Routine" button
const generateRoutineBtn = document.getElementById("generateRoutine");

// Helper function to clean AI response (removes leading hashtags and trims lines)
function cleanAIResponse(text) {
  return text
    .split('\n')
    .map(line => line.replace(/^#+\s*/, '').trim())
    .filter(line => line.length > 0)
    .join('<br>');
}

// When the user clicks "Generate Routine"
generateRoutineBtn.addEventListener("click", async () => {
  chatWindow.innerHTML = `<div class="placeholder-message">Generating your routine...</div>`;

  const products = await loadProducts();
  const selectedProducts = products.filter((product) =>
    selectedProductIds.includes(product.id)
  );

  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `<div class="placeholder-message">Please select products to generate a routine.</div>`;
    return;
  }

  // Start a new chat history for this session
  chatHistory = [
    {
      role: "system",
      content:
        "You are a helpful beauty advisor. Only answer questions about the generated routine, skincare, haircare, makeup, fragrance, or related topics.",
    },
    {
      role: "user",
      content: `Here are my selected products:\n${JSON.stringify(
        selectedProducts,
        null,
        2
      )}\nPlease generate a personalized routine.`,
    },
  ];

  try {
    const response = await fetch("https://glascony.adnans-2e2.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: chatHistory }),
    });

    const data = await response.json();

    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Clean the AI response before displaying
      const cleaned = cleanAIResponse(data.choices[0].message.content);
      chatWindow.innerHTML = `<div>${cleaned}</div>`;
      chatHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
    } else {
      chatWindow.innerHTML = `<div class="placeholder-message">Sorry, something went wrong. Please try again.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML = `<div class="placeholder-message">Error: Unable to connect to OpenAI API.</div>`;
  }
});

// Chat form submission handler for follow-up questions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user's question from the input box
  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  // Show user's question in the chat window
  chatWindow.innerHTML += `<div><strong>You:</strong> ${userInput}</div>`;

  // Add user's question to chat history
  chatHistory.push({
    role: "user",
    content: userInput,
  });

  // Show loading message
  chatWindow.innerHTML += `<div class="placeholder-message">Thinking...</div>`;

  try {
    // Send the full chat history to the API for context
    const response = await fetch("https://glascony.adnans-2e2.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: chatHistory }),
    });

    const data = await response.json();

    // Remove loading message
    chatWindow.innerHTML = chatWindow.innerHTML.replace(
      `<div class="placeholder-message">Thinking...</div>`,
      ""
    );

    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Clean the AI response before displaying
      const cleaned = cleanAIResponse(data.choices[0].message.content);
      chatWindow.innerHTML += `<div><strong>Advisor:</strong> ${cleaned}</div>`;
      chatHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
    } else {
      chatWindow.innerHTML += `<div class="placeholder-message">Sorry, something went wrong. Please try again.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML += `<div class="placeholder-message">Error: Unable to connect to OpenAI API.</div>`;
  }

  // Clear the input box
  document.getElementById("userInput").value = "";
});

/* RTL toggle logic for beginners */
const rtlToggle = document.getElementById("rtlToggle");
const htmlRoot = document.getElementById("htmlRoot");

// Track RTL state in localStorage for persistence
function setRTLMode(isRTL) {
  htmlRoot.setAttribute("dir", isRTL ? "rtl" : "ltr");
  rtlToggle.textContent = isRTL ? "Switch to LTR" : "Switch to RTL";
  localStorage.setItem("rtlMode", isRTL ? "rtl" : "ltr");
}

// On page load, set RTL mode from localStorage
const savedRTL = localStorage.getItem("rtlMode");
setRTLMode(savedRTL === "rtl");

// Toggle RTL/LTR when button is clicked
rtlToggle.addEventListener("click", () => {
  const isRTL = htmlRoot.getAttribute("dir") !== "rtl";
  setRTLMode(isRTL);
});