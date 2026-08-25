/**
 * AVIORA PREMIUM DRESS - Official Product Catalog & Inventory Manager
 * Curated exclusively with Aviora signature spaghetti strap button-down slit maxi dresses
 */

const DEFAULT_PRODUCTS = [
  {
    id: "av-001",
    name: "Aviora Leopard Noir Striped Maxi Dress",
    category: "Signature Print",
    price: 2200,
    discountPrice: null,
    badge: "NEW ARRIVAL",
    featured: true,
    rating: 5.0,
    reviewsCount: 38,
    sizes: ["Free Size (S - XL)", "Custom Fit"],
    colors: [
      { name: "Leopard Striped Noir", hex: "#4A3525" }
    ],
    image: "assets/images/dress_1_leopard.png",
    gallery: [
      "assets/images/dress_1_leopard.png"
    ],
    description: "Exquisite spaghetti strap button-down maxi dress crafted with vertical black contrast panels and a luxury leopard animal print. Features a delicate front slit, flattering tailored bodice, and lightweight breathable luxury fabric designed for warm tropical days and evening outings.",
    fabric: "Premium Rayon-Linen Blend (Soft & Breathable)",
    care: "Gentle hand wash or delicate machine cycle. Cool iron inside out.",
    inStock: true
  },
  {
    id: "av-002",
    name: "Aviora Botanical Palm Oasis Maxi Dress",
    category: "Tropical Chic",
    price: 2200,
    discountPrice: null,
    badge: "BEST SELLER",
    featured: true,
    rating: 4.9,
    reviewsCount: 45,
    sizes: ["Free Size (S - XL)", "Custom Fit"],
    colors: [
      { name: "Cream Palm Foliage", hex: "#EAE5D9" }
    ],
    image: "assets/images/dress_2_botanical.jpg",
    gallery: [
      "assets/images/dress_2_botanical.jpg"
    ],
    description: "An elegant ivory-cream maxi dress adorned with hand-painted tropical botanical palm fronds and terracotta leaf prints. Finished with wooden-style front buttons, spaghetti straps, and a front center slit.",
    fabric: "Pure Rayon Crepe (Non-see-through & Soft)",
    care: "Hand wash cold. Line dry in shade.",
    inStock: true
  },
  {
    id: "av-003",
    name: "Aviora Emerald Sunburst Batik Maxi Dress",
    category: "Artisanal Batik",
    price: 2200,
    discountPrice: null,
    badge: "TRENDING",
    featured: true,
    rating: 5.0,
    reviewsCount: 29,
    sizes: ["Free Size (S - XL)", "Custom Fit"],
    colors: [
      { name: "Emerald & Sunburst Gold", hex: "#0E3A2F" }
    ],
    image: "assets/images/dress_3_green_batik.png",
    gallery: [
      "assets/images/dress_3_green_batik.png"
    ],
    description: "A show-stopping emerald green and sunshine yellow circular tie-dye sunburst motif maxi. Features a sweetheart neckline with spaghetti straps and buttons leading down to an alluring center slit.",
    fabric: "High-Grade Handcrafted Batik Rayon",
    care: "Gentle hand wash with mild liquid soap.",
    inStock: true
  },
  {
    id: "av-004",
    name: "Aviora Imperial Crimson Batik Maxi Dress",
    category: "Artisanal Batik",
    price: 2200,
    discountPrice: null,
    badge: "EXCLUSIVE",
    featured: true,
    rating: 4.9,
    reviewsCount: 31,
    sizes: ["Free Size (S - XL)", "Custom Fit"],
    colors: [
      { name: "Crimson & Amber Geometric", hex: "#6B1D2A" }
    ],
    image: "assets/images/dress_4_crimson_batik.jpg",
    gallery: [
      "assets/images/dress_4_crimson_batik.jpg"
    ],
    description: "Rich maroon crimson, amber mustard, and ivory crackle batik geometric patchwork dress. High fashion editorial appeal with front wooden buttons and fluid floor-length drape.",
    fabric: "Artisanal Dyed Soft Viscose Rayon",
    care: "Hand wash separately in cold water.",
    inStock: true
  },
  {
    id: "av-005",
    name: "Aviora Scarlet Blossom Floral Maxi Dress",
    category: "Floral Luxe",
    price: 2200,
    discountPrice: null,
    badge: "POPULAR",
    featured: true,
    rating: 5.0,
    reviewsCount: 52,
    sizes: ["Free Size (S - XL)", "Custom Fit"],
    colors: [
      { name: "Blush Pink & Scarlet Red", hex: "#D84A58" }
    ],
    image: "assets/images/dress_5_scarlet_floral.png",
    gallery: [
      "assets/images/dress_5_scarlet_floral.png"
    ],
    description: "A romantic blush pink base highlighted with bold watercolor scarlet red poppy blooms. Spaghetti shoulder straps with beaded accents, button-through front, and center slit.",
    fabric: "Airy Floral Rayon Crepe",
    care: "Delicate hand wash. Do not bleach.",
    inStock: true
  }
];

const STORAGE_KEY = "aviora_products_inventory_v2";

/**
 * Get all products (initiates storage if empty)
 */
function getProducts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Error reading inventory from LocalStorage:", e);
    return DEFAULT_PRODUCTS;
  }
}

/**
 * Save the entire products array to LocalStorage
 */
function saveAllProducts(productsArray) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(productsArray));
  window.dispatchEvent(new CustomEvent("aviora:inventoryUpdated", { detail: productsArray }));
}

/**
 * Get a single product by ID
 */
function getProductById(id) {
  const list = getProducts();
  return list.find(item => item.id === id) || null;
}

/**
 * Add a new product
 */
function addProduct(productData) {
  const list = getProducts();
  const newProduct = {
    id: "av-" + Date.now().toString(36),
    rating: 5.0,
    reviewsCount: 1,
    inStock: true,
    featured: true,
    sizes: ["Free Size (S - XL)", "Custom Fit"],
    colors: [{ name: "Standard", hex: "#C86D51" }],
    gallery: [productData.image],
    ...productData
  };
  list.unshift(newProduct);
  saveAllProducts(list);
  return newProduct;
}

/**
 * Update an existing product
 */
function updateProduct(id, updatedFields) {
  const list = getProducts();
  const index = list.findIndex(p => p.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updatedFields };
    saveAllProducts(list);
    return list[index];
  }
  return null;
}

/**
 * Delete a product
 */
function deleteProduct(id) {
  let list = getProducts();
  list = list.filter(p => p.id !== id);
  saveAllProducts(list);
  return true;
}

/**
 * Reset to default product catalogue
 */
function resetToDefaultProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
  window.dispatchEvent(new CustomEvent("aviora:inventoryUpdated", { detail: DEFAULT_PRODUCTS }));
  return DEFAULT_PRODUCTS;
}

/**
 * Currency formatter (LKR)
 */
function formatLKR(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "Rs. 2,200.00";
  return "Rs. " + amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Force initialize v2 inventory
localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
