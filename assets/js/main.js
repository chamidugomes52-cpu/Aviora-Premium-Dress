/**
 * AVIORA PREMIUM DRESS - Core Main Script
 * Handles Cart, Wishlist, WhatsApp Order Dispatch, Butterfly Canvas Particles, Mobile Menu, Toasts & Modals
 */

// Brand Configuration
const AVIORA_CONFIG = {
  brandName: "AVIORA PREMIUM DRESS",
  get whatsappNumber() {
    return localStorage.getItem("aviora_owner_whatsapp") || "94771234567";
  },
  set whatsappNumber(num) {
    localStorage.setItem("aviora_owner_whatsapp", num.replace(/[^0-9]/g, ''));
  },
  currency: "LKR",
  currencySymbol: "Rs.",
  deliveryFee: 450 // User specified delivery charge Rs. 450
};

// State Storage Keys
const CART_STORAGE_KEY = "aviora_cart_items_v2";
const WISHLIST_STORAGE_KEY = "aviora_wishlist_items_v2";

// Global In-Memory State
let cartItems = [];
let wishlistItems = [];

// Initialize Cart & Wishlist from LocalStorage
function initStoreState() {
  try {
    cartItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    wishlistItems = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY)) || [];
  } catch (e) {
    cartItems = [];
    wishlistItems = [];
  }
  updateCartBadge();
  updateWishlistBadge();
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  updateCartBadge();
  renderCartDrawer();
  window.dispatchEvent(new CustomEvent("aviora:cartUpdated", { detail: cartItems }));
}

function saveWishlist() {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
  updateWishlistBadge();
  window.dispatchEvent(new CustomEvent("aviora:wishlistUpdated", { detail: wishlistItems }));
}

// Add to Cart
function addToCart(productId, size = "Free Size (S - XL)", color = null, quantity = 1) {
  const product = getProductById(productId);
  if (!product) {
    showToast("Product not found", "error");
    return;
  }

  const selectedColor = color || (product.colors && product.colors.length > 0 ? product.colors[0].name : "Standard");
  const priceToUse = product.discountPrice ? product.discountPrice : product.price;

  const existingIndex = cartItems.findIndex(
    item => item.id === productId && item.size === size && item.color === selectedColor
  );

  if (existingIndex > -1) {
    cartItems[existingIndex].quantity += quantity;
  } else {
    cartItems.push({
      id: product.id,
      name: product.name,
      price: priceToUse,
      originalPrice: product.price,
      image: product.image,
      size: size,
      color: selectedColor,
      quantity: quantity
    });
  }

  saveCart();
  showToast(`Added <strong>${product.name}</strong> to your Shopping Bag!`, "success");
  openCartDrawer();
}

// Remove from Cart
function removeFromCart(index) {
  if (index >= 0 && index < cartItems.length) {
    const removed = cartItems.splice(index, 1)[0];
    saveCart();
    showToast(`Removed <strong>${removed.name}</strong> from bag.`, "info");
  }
}

// Update Cart Item Quantity
function updateCartQuantity(index, delta) {
  if (index >= 0 && index < cartItems.length) {
    cartItems[index].quantity += delta;
    if (cartItems[index].quantity <= 0) {
      removeFromCart(index);
    } else {
      saveCart();
    }
  }
}

// Wishlist Toggle
function toggleWishlist(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const index = wishlistItems.indexOf(productId);
  if (index > -1) {
    wishlistItems.splice(index, 1);
    showToast(`Removed <strong>${product.name}</strong> from Wishlist`, "info");
  } else {
    wishlistItems.push(productId);
    showToast(`Added <strong>${product.name}</strong> to your Wishlist ❤️`, "success");
  }
  saveWishlist();
  updateWishlistButtons();
}

function isInWishlist(productId) {
  return wishlistItems.includes(productId);
}

// Update Badges
function updateCartBadge() {
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const badges = document.querySelectorAll(".cart-count-badge");
  badges.forEach(b => {
    b.textContent = totalCount;
    b.classList.toggle("hidden", totalCount === 0);
  });
}

function updateWishlistBadge() {
  const count = wishlistItems.length;
  const badges = document.querySelectorAll(".wishlist-count-badge");
  badges.forEach(b => {
    b.textContent = count;
    b.classList.toggle("hidden", count === 0);
  });
}

function updateWishlistButtons() {
  document.querySelectorAll("[data-wishlist-id]").forEach(btn => {
    const id = btn.getAttribute("data-wishlist-id");
    const isWishlisted = isInWishlist(id);
    const heartSvg = btn.querySelector("svg");
    if (heartSvg) {
      if (isWishlisted) {
        heartSvg.setAttribute("fill", "#C86D51");
        heartSvg.setAttribute("stroke", "#C86D51");
      } else {
        heartSvg.setAttribute("fill", "none");
        heartSvg.setAttribute("stroke", "currentColor");
      }
    }
  });
}

// Calculate Cart Totals
function getCartSummary() {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const delivery = subtotal > 0 ? AVIORA_CONFIG.deliveryFee : 0;
  const total = subtotal + delivery;

  return {
    subtotal,
    delivery,
    total,
    count: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  };
}

// Render Slide-over Cart Drawer
function renderCartDrawer() {
  const container = document.getElementById("cart-drawer-items");
  const subtotalElem = document.getElementById("cart-drawer-subtotal");
  const deliveryElem = document.getElementById("cart-drawer-delivery");
  const totalElem = document.getElementById("cart-drawer-total");
  const emptyElem = document.getElementById("cart-drawer-empty");
  const footerElem = document.getElementById("cart-drawer-footer");

  if (!container) return;

  if (cartItems.length === 0) {
    if (emptyElem) emptyElem.classList.remove("hidden");
    if (footerElem) footerElem.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  if (emptyElem) emptyElem.classList.add("hidden");
  if (footerElem) footerElem.classList.remove("hidden");

  const summary = getCartSummary();
  if (subtotalElem) subtotalElem.textContent = formatLKR(summary.subtotal);
  if (deliveryElem) deliveryElem.textContent = formatLKR(summary.delivery);
  if (totalElem) totalElem.textContent = formatLKR(summary.total);

  container.innerHTML = cartItems.map((item, idx) => `
    <div class="flex items-center gap-4 py-3 border-b border-[#242430]/70 group">
      <img src="${item.image}" alt="${item.name}" class="w-16 h-20 object-cover rounded-lg border border-[#C86D51]/30 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-medium text-white truncate group-hover:text-[#E07A5F] transition-colors">${item.name}</h4>
        <p class="text-xs text-[#A3A3B2] mt-0.5">Size: <span class="text-white font-medium">${item.size}</span></p>
        <p class="text-xs font-semibold text-[#DF8A68] mt-1">${formatLKR(item.price)}</p>
        
        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center border border-[#2c2c3a] rounded-md bg-[#101015]">
            <button onclick="updateCartQuantity(${idx}, -1)" class="px-2 py-0.5 text-xs text-[#A3A3B2] hover:text-white transition-colors">-</button>
            <span class="px-2.5 py-0.5 text-xs text-white font-medium">${item.quantity}</span>
            <button onclick="updateCartQuantity(${idx}, 1)" class="px-2 py-0.5 text-xs text-[#A3A3B2] hover:text-white transition-colors">+</button>
          </div>
          <button onclick="removeFromCart(${idx})" class="text-xs text-red-400/80 hover:text-red-400 flex items-center gap-1 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            Remove
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// Open / Close Cart Drawer
function openCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-drawer-overlay");
  renderCartDrawer();
  if (drawer && overlay) {
    overlay.classList.remove("hidden");
    setTimeout(() => {
      overlay.classList.remove("opacity-0");
      drawer.classList.remove("translate-x-full");
    }, 10);
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-drawer-overlay");
  if (drawer && overlay) {
    drawer.classList.add("translate-x-full");
    overlay.classList.add("opacity-0");
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 300);
  }
}

// Set Owner's WhatsApp Number
function configureWhatsAppNumber() {
  const current = AVIORA_CONFIG.whatsappNumber;
  const entered = prompt("Enter your WhatsApp Phone Number for receiving orders (e.g., 94771234567 or 0771234567):", current);
  if (entered) {
    let clean = entered.replace(/[^0-9]/g, '');
    if (clean.startsWith("0")) {
      clean = "94" + clean.substring(1);
    }
    AVIORA_CONFIG.whatsappNumber = clean;
    showToast(`WhatsApp Order number updated to: <strong>+${clean}</strong> ✨`, "success");
  }
}

// Generate Direct WhatsApp Order for Entire Cart or Single Product
function orderViaWhatsApp(singleProductId = null, selectedSize = "Free Size (S - XL)", selectedColor = "Standard") {
  let message = `✨ *NEW ORDER - AVIORA PREMIUM DRESS* ✨\n\n`;

  if (singleProductId) {
    const product = getProductById(singleProductId);
    if (!product) return;
    const itemPrice = product.discountPrice || product.price;
    const delivery = AVIORA_CONFIG.deliveryFee;
    const grandTotal = itemPrice + delivery;

    message += `👗 *Item:* ${product.name}\n`;
    message += `🏷️ *SKU:* ${product.id.toUpperCase()}\n`;
    message += `📏 *Size:* ${selectedSize}\n`;
    message += `🎨 *Design:* ${selectedColor}\n`;
    message += `💰 *Dress Price:* ${formatLKR(itemPrice)}\n`;
    message += `🚚 *Delivery Charge:* ${formatLKR(delivery)}\n`;
    message += `--------------------------------\n`;
    message += `💎 *Total Amount Payable:* ${formatLKR(grandTotal)}\n\n`;
  } else {
    if (cartItems.length === 0) {
      showToast("Your shopping bag is empty!", "info");
      return;
    }
    const summary = getCartSummary();
    message += `🛍️ *ORDER ITEMS (${summary.count}):*\n\n`;
    cartItems.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n   Size: ${item.size} | Qty: ${item.quantity}\n   Price: ${formatLKR(item.price * item.quantity)}\n\n`;
    });
    message += `--------------------------------\n`;
    message += `💵 *Items Subtotal:* ${formatLKR(summary.subtotal)}\n`;
    message += `🚚 *Delivery Charge:* ${formatLKR(summary.delivery)}\n`;
    message += `💎 *GRAND TOTAL PAYABLE:* ${formatLKR(summary.total)}\n\n`;
  }

  message += `👤 *Customer Details:*\n`;
  message += `Name: \n`;
  message += `Contact / WhatsApp No: \n`;
  message += `Delivery Address & Nearest City: \n`;
  message += `Special Notes / Sizing: \n\n`;
  message += `_Sent via Aviora Premium Dress Online Boutique_ 🦋`;

  const encoded = encodeURIComponent(message);
  const targetNumber = AVIORA_CONFIG.whatsappNumber;
  const whatsappUrl = `https://wa.me/${targetNumber}?text=${encoded}`;
  window.open(whatsappUrl, "_blank");
}

// Quick View Modal
function openQuickView(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const modal = document.getElementById("quick-view-modal");
  const content = document.getElementById("quick-view-content");
  if (!modal || !content) return;

  const currentPrice = product.discountPrice ? product.discountPrice : product.price;

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div class="relative group rounded-xl overflow-hidden bg-[#101015] border border-[#C86D51]/20">
        <img id="qv-main-img" src="${product.image}" alt="${product.name}" class="w-full h-96 object-cover object-top transition-transform duration-500 hover:scale-105" />
        <span class="absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full badge-copper">${product.badge || product.category}</span>
      </div>

      <div class="flex flex-col justify-between">
        <div>
          <span class="text-xs uppercase tracking-widest text-[#DF8A68] font-semibold">${product.category}</span>
          <h3 class="text-2xl font-cinzel font-bold text-white mt-1">${product.name}</h3>
          
          <div class="flex items-center gap-2 mt-2">
            <div class="flex text-amber-400 text-sm">★★★★★</div>
            <span class="text-xs text-[#A3A3B2]">(${product.reviewsCount || 35} luxury reviews)</span>
          </div>

          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-2xl font-bold text-[#E07A5F]">${formatLKR(currentPrice)}</span>
            <span class="text-xs text-[#A3A3B2] font-normal">+ Rs. 450 Delivery</span>
          </div>

          <p class="text-sm text-[#A3A3B2] mt-4 leading-relaxed font-sans">${product.description}</p>

          <!-- Size Selector -->
          <div class="mt-5">
            <div class="flex justify-between items-center text-xs text-[#A3A3B2] mb-2">
              <span class="uppercase tracking-wider font-semibold text-white">Select Size</span>
              <span class="text-[#DF8A68] underline cursor-pointer hover:text-white" onclick="openSizeChart()">Size Guide</span>
            </div>
            <div class="flex flex-wrap gap-2" id="qv-size-selector">
              ${(product.sizes || ["Free Size (S - XL)", "Custom Fit"]).map((size, idx) => `
                <button type="button" onclick="selectQuickViewSize(this, '${size}')" class="qv-size-btn px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${idx === 0 ? 'border-[#C86D51] bg-[#C86D51]/20 text-white' : 'border-[#2a2a38] text-[#A3A3B2] hover:border-white hover:text-white'}">
                  ${size}
                </button>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#222230]">
          <button onclick="handleQuickViewAddToCart('${product.id}')" class="flex-1 px-5 py-3 rounded-xl copper-gradient text-white font-semibold text-sm shadow-lg copper-hover-glow btn-shimmer flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            Add to Shopping Bag
          </button>
          
          <button onclick="handleQuickViewWhatsApp('${product.id}')" class="px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
            WhatsApp Order
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0");
  }, 10);
}

function closeQuickView() {
  const modal = document.getElementById("quick-view-modal");
  if (modal) {
    modal.classList.add("opacity-0");
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 250);
  }
}

let currentQvSize = "Free Size (S - XL)";
let currentQvColor = "Standard";

function selectQuickViewSize(btn, size) {
  currentQvSize = size;
  document.querySelectorAll(".qv-size-btn").forEach(b => {
    b.classList.remove("border-[#C86D51]", "bg-[#C86D51]/20", "text-white");
    b.classList.add("border-[#2a2a38]", "text-[#A3A3B2]");
  });
  btn.classList.add("border-[#C86D51]", "bg-[#C86D51]/20", "text-white");
  btn.classList.remove("border-[#2a2a38]", "text-[#A3A3B2]");
}

function handleQuickViewAddToCart(productId) {
  addToCart(productId, currentQvSize, currentQvColor, 1);
  closeQuickView();
}

function handleQuickViewWhatsApp(productId) {
  orderViaWhatsApp(productId, currentQvSize, currentQvColor);
}

// Size Chart Modal
function openSizeChart() {
  const modal = document.getElementById("size-chart-modal");
  if (modal) {
    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.remove("opacity-0"), 10);
  }
}

function closeSizeChart() {
  const modal = document.getElementById("size-chart-modal");
  if (modal) {
    modal.classList.add("opacity-0");
    setTimeout(() => modal.classList.add("hidden"), 200);
  }
}

// Toast Notifications System
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";

  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<span class="w-6 h-6 rounded-full bg-[#C86D51]/20 text-[#DF8A68] flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></span>`;
  } else if (type === "error") {
    iconSvg = `<span class="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></span>`;
  } else {
    iconSvg = `<span class="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div class="flex-1 text-xs sm:text-sm font-sans">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-[#A3A3B2] hover:text-white ml-2">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Butterfly Canvas Animation
function initButterflyCanvas() {
  const canvas = document.getElementById("butterflyCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = canvas.parentElement.offsetWidth);
  let height = (canvas.height = canvas.parentElement.offsetHeight);

  window.addEventListener("resize", () => {
    if (canvas.parentElement) {
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    }
  });

  const butterflies = [];
  const butterflyCount = window.innerWidth < 768 ? 12 : 24;

  for (let i = 0; i < butterflyCount; i++) {
    butterflies.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 10 + 6,
      speedX: (Math.random() - 0.5) * 0.8 + 0.3,
      speedY: (Math.random() - 0.5) * 0.6,
      flapSpeed: Math.random() * 0.15 + 0.08,
      flapAngle: Math.random() * Math.PI,
      opacity: Math.random() * 0.5 + 0.25,
      hue: Math.random() > 0.6 ? "#DF8A68" : "#C86D51"
    });
  }

  function drawButterfly(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.globalAlpha = b.opacity;

    const flap = Math.sin(b.flapAngle);
    const wingScale = Math.abs(flap);

    ctx.fillStyle = b.hue;
    ctx.strokeStyle = "rgba(255, 240, 230, 0.4)";
    ctx.lineWidth = 0.5;

    ctx.beginPath();
    ctx.ellipse(-b.size * 0.6 * wingScale, -b.size * 0.3, b.size * 0.7 * wingScale, b.size * 0.9, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(b.size * 0.6 * wingScale, -b.size * 0.3, b.size * 0.7 * wingScale, b.size * 0.9, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FDFBF7";
    ctx.fillRect(-0.8, -b.size * 0.5, 1.6, b.size * 0.9);

    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    butterflies.forEach(b => {
      b.x += b.speedX;
      b.y += b.speedY;
      b.flapAngle += b.flapSpeed;

      if (b.x > width + 20) b.x = -20;
      if (b.x < -20) b.x = width + 20;
      if (b.y > height + 20) b.y = -20;
      if (b.y < -20) b.y = height + 20;

      drawButterfly(b);
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// Global Nav & Mobile Menu
function initNavigation() {
  const mobileToggle = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  const nav = document.querySelector("header nav");
  if (nav) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 40) {
        nav.classList.add("shadow-2xl", "shadow-black/70", "bg-[#08080A]/95");
      } else {
        nav.classList.remove("shadow-2xl", "shadow-black/70");
      }
    });
  }
}

// Initialize on DOM Loaded
document.addEventListener("DOMContentLoaded", () => {
  initStoreState();
  initNavigation();
  initButterflyCanvas();
  updateWishlistButtons();

  window.addEventListener("aviora:inventoryUpdated", () => {
    if (typeof renderProductsGrid === "function") {
      renderProductsGrid();
    }
  });
});
