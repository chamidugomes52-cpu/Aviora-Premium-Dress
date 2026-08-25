/**
 * AVIORA PREMIUM DRESS - Admin Management Controller
 * Handles CRUD operations for dresses, live price updates, image uploads, and inventory statistics
 */

let currentEditingId = null;
let uploadedImageBase64 = null;

document.addEventListener("DOMContentLoaded", () => {
  renderAdminStats();
  renderAdminTable();
  setupAdminEventListeners();
});

// Calculate and render boutique statistics
function renderAdminStats() {
  const products = getProducts();
  const totalCount = products.length;
  const categories = new Set(products.map(p => p.category));
  const onSaleCount = products.filter(p => p.discountPrice && p.discountPrice < p.price).length;
  
  const totalPrice = products.reduce((sum, p) => sum + (p.discountPrice || p.price), 0);
  const avgPrice = totalCount > 0 ? Math.round(totalPrice / totalCount) : 0;

  const statTotal = document.getElementById("stat-total-products");
  const statCategories = document.getElementById("stat-categories");
  const statAvgPrice = document.getElementById("stat-avg-price");
  const statOnSale = document.getElementById("stat-on-sale");

  if (statTotal) statTotal.textContent = totalCount;
  if (statCategories) statCategories.textContent = categories.size;
  if (statAvgPrice) statAvgPrice.textContent = formatLKR(avgPrice);
  if (statOnSale) statOnSale.textContent = onSaleCount;
}

// Render Products in Admin Table
function renderAdminTable(filterCategory = "all", searchQuery = "") {
  const tableBody = document.getElementById("admin-products-table");
  if (!tableBody) return;

  let products = getProducts();

  // Apply filters
  if (filterCategory !== "all") {
    products = products.filter(p => p.category === filterCategory);
  }

  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.badge && p.badge.toLowerCase().includes(q))
    );
  }

  if (products.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-[#A3A3B2]">
          <div class="flex flex-col items-center justify-center">
            <svg class="w-12 h-12 text-[#C86D51]/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <p class="text-base font-medium text-white">No dresses found</p>
            <p class="text-xs text-[#A3A3B2] mt-1">Try adjusting your search query or add a new dress design.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = products.map((product, idx) => {
    const currentPrice = product.discountPrice ? product.discountPrice : product.price;
    const discountBadge = product.discountPrice 
      ? `<span class="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">SALE</span>` 
      : "";

    return `
      <tr class="border-b border-[#242432]/70 hover:bg-[#181822]/60 transition-colors group">
        <td class="px-5 py-4 whitespace-nowrap text-xs text-[#A3A3B2] font-mono">
          #${idx + 1}
        </td>
        <td class="px-5 py-4 whitespace-nowrap">
          <div class="flex items-center gap-3">
            <img src="${product.image}" alt="${product.name}" class="w-12 h-14 object-cover object-top rounded-md border border-[#C86D51]/30 flex-shrink-0" />
            <div>
              <div class="text-sm font-semibold text-white group-hover:text-[#E07A5F] transition-colors">${product.name}</div>
              <div class="text-xs text-[#A3A3B2] flex items-center gap-1.5 mt-0.5">
                <span class="inline-block w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-400' : 'bg-red-400'}"></span>
                <span>${product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                ${product.badge ? `<span class="text-[10px] text-[#DF8A68] border border-[#DF8A68]/30 px-1.5 py-0.2 rounded">${product.badge}</span>` : ''}
              </div>
            </div>
          </div>
        </td>
        <td class="px-5 py-4 whitespace-nowrap text-xs font-medium text-[#EAE5D9]">
          <span class="px-2.5 py-1 rounded-md bg-[#161620] border border-[#2a2a38] text-xs">${product.category}</span>
        </td>
        <td class="px-5 py-4 whitespace-nowrap">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-[#E07A5F]">${formatLKR(currentPrice)}</span>
              ${discountBadge}
            </div>
            ${product.discountPrice ? `<span class="text-xs text-[#A3A3B2] line-through">Regular: ${formatLKR(product.price)}</span>` : ''}
          </div>
        </td>
        <td class="px-5 py-4 whitespace-nowrap text-xs text-[#A3A3B2]">
          <div class="flex flex-wrap gap-1 max-w-[140px]">
            ${(product.sizes || []).map(s => `<span class="px-1.5 py-0.5 bg-[#121218] border border-[#2c2c3a] rounded text-[10px] text-white">${s}</span>`).join('')}
          </div>
        </td>
        <td class="px-5 py-4 whitespace-nowrap">
          <button onclick="toggleStockStatus('${product.id}')" class="px-2.5 py-1 rounded-full text-xs font-medium transition-all ${product.inStock ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25' : 'bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25'}">
            ${product.inStock ? 'Active' : 'Draft/Hidden'}
          </button>
        </td>
        <td class="px-5 py-4 whitespace-nowrap text-right text-xs font-medium">
          <div class="flex items-center justify-end gap-2">
            <button onclick="openPriceQuickEditModal('${product.id}')" title="Quick Price Edit" class="p-1.5 rounded-lg bg-[#C86D51]/15 text-[#DF8A68] hover:bg-[#C86D51] hover:text-white transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
            <button onclick="openEditProductModal('${product.id}')" title="Full Edit" class="p-1.5 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-600 hover:text-white transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button onclick="confirmDeleteProduct('${product.id}')" title="Delete Dress" class="p-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-600 hover:text-white transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Setup Event Listeners for Filters, Search & Image Upload
function setupAdminEventListeners() {
  const searchInput = document.getElementById("admin-search");
  const categoryFilter = document.getElementById("admin-category-filter");
  const imageFileInput = document.getElementById("dress-image-file");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const selectedCat = categoryFilter ? categoryFilter.value : "all";
      renderAdminTable(selectedCat, e.target.value);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
      const q = searchInput ? searchInput.value : "";
      renderAdminTable(e.target.value, q);
    });
  }

  // Direct Image File to Base64 Reader
  if (imageFileInput) {
    imageFileInput.addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          uploadedImageBase64 = event.target.result;
          const previewImg = document.getElementById("image-preview");
          if (previewImg) {
            previewImg.src = uploadedImageBase64;
            previewImg.classList.remove("hidden");
          }
          const urlInput = document.getElementById("dress-image-url");
          if (urlInput) urlInput.value = "";
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Open Modal to Add New Dress
function openAddProductModal() {
  currentEditingId = null;
  uploadedImageBase64 = null;

  document.getElementById("modal-dress-title").textContent = "Add New Dress Design";
  document.getElementById("product-form").reset();
  
  const previewImg = document.getElementById("image-preview");
  if (previewImg) {
    previewImg.src = "";
    previewImg.classList.add("hidden");
  }

  const modal = document.getElementById("product-form-modal");
  if (modal) {
    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.remove("opacity-0"), 10);
  }
}

// Open Modal to Edit Existing Dress
function openEditProductModal(id) {
  const product = getProductById(id);
  if (!product) return;

  currentEditingId = id;
  uploadedImageBase64 = null;

  document.getElementById("modal-dress-title").textContent = `Edit: ${product.name}`;
  
  // Fill Form Values
  document.getElementById("dress-name").value = product.name || "";
  document.getElementById("dress-category").value = product.category || "Evening Gowns";
  document.getElementById("dress-price").value = product.price || "";
  document.getElementById("dress-discount-price").value = product.discountPrice || "";
  document.getElementById("dress-badge").value = product.badge || "";
  document.getElementById("dress-description").value = product.description || "";
  document.getElementById("dress-fabric").value = product.fabric || "";
  document.getElementById("dress-image-url").value = product.image.startsWith("data:") ? "" : product.image;

  // Set Checkboxes for sizes
  const sizes = product.sizes || ["S", "M", "L"];
  document.querySelectorAll(".size-checkbox").forEach(cb => {
    cb.checked = sizes.includes(cb.value);
  });

  const previewImg = document.getElementById("image-preview");
  if (previewImg) {
    previewImg.src = product.image;
    previewImg.classList.remove("hidden");
  }

  const modal = document.getElementById("product-form-modal");
  if (modal) {
    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.remove("opacity-0"), 10);
  }
}

// Close Product Form Modal
function closeProductModal() {
  const modal = document.getElementById("product-form-modal");
  if (modal) {
    modal.classList.add("opacity-0");
    setTimeout(() => modal.classList.add("hidden"), 200);
  }
}

// Handle Form Submission (Add or Edit)
function handleProductFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("dress-name").value.trim();
  const category = document.getElementById("dress-category").value;
  const price = parseFloat(document.getElementById("dress-price").value);
  const discountPriceInput = document.getElementById("dress-discount-price").value;
  const discountPrice = discountPriceInput ? parseFloat(discountPriceInput) : null;
  const badge = document.getElementById("dress-badge").value.trim();
  const description = document.getElementById("dress-description").value.trim();
  const fabric = document.getElementById("dress-fabric").value.trim() || "Luxury Fabric";
  const urlImage = document.getElementById("dress-image-url").value.trim();

  // Selected sizes
  const selectedSizes = [];
  document.querySelectorAll(".size-checkbox:checked").forEach(cb => {
    selectedSizes.push(cb.value);
  });

  if (!name || isNaN(price)) {
    showToast("Please provide dress name and valid price", "error");
    return;
  }

  // Determine Image to use
  let finalImage = uploadedImageBase64;
  if (!finalImage) {
    finalImage = urlImage || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80";
  }

  if (currentEditingId) {
    // Update existing
    const existing = getProductById(currentEditingId);
    const updatedImage = (uploadedImageBase64 || urlImage) ? finalImage : (existing ? existing.image : finalImage);

    updateProduct(currentEditingId, {
      name,
      category,
      price,
      discountPrice,
      badge: badge || null,
      description,
      fabric,
      sizes: selectedSizes.length > 0 ? selectedSizes : ["S", "M", "L"],
      image: updatedImage,
      gallery: [updatedImage]
    });

    showToast(`Updated <strong>${name}</strong> successfully!`, "success");
  } else {
    // Add new product
    addProduct({
      name,
      category,
      price,
      discountPrice,
      badge: badge || "NEW",
      description: description || "Exclusively crafted by Aviora Premium Dress.",
      fabric,
      sizes: selectedSizes.length > 0 ? selectedSizes : ["S", "M", "L", "XL"],
      image: finalImage,
      gallery: [finalImage]
    });

    showToast(`Added <strong>${name}</strong> to boutique catalog!`, "success");
  }

  closeProductModal();
  renderAdminStats();
  renderAdminTable();
}

// Quick Price Edit Modal
function openPriceQuickEditModal(id) {
  const product = getProductById(id);
  if (!product) return;

  const modal = document.getElementById("quick-price-modal");
  if (!modal) return;

  document.getElementById("qp-product-id").value = product.id;
  document.getElementById("qp-product-name").textContent = product.name;
  document.getElementById("qp-regular-price").value = product.price;
  document.getElementById("qp-discount-price").value = product.discountPrice || "";

  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.remove("opacity-0"), 10);
}

function closeQuickPriceModal() {
  const modal = document.getElementById("quick-price-modal");
  if (modal) {
    modal.classList.add("opacity-0");
    setTimeout(() => modal.classList.add("hidden"), 200);
  }
}

function handleQuickPriceSave(e) {
  e.preventDefault();
  const id = document.getElementById("qp-product-id").value;
  const regularPrice = parseFloat(document.getElementById("qp-regular-price").value);
  const discountVal = document.getElementById("qp-discount-price").value;
  const discountPrice = discountVal ? parseFloat(discountVal) : null;

  if (isNaN(regularPrice)) {
    showToast("Invalid price amount", "error");
    return;
  }

  updateProduct(id, {
    price: regularPrice,
    discountPrice: discountPrice
  });

  showToast("Price updated successfully! 💎", "success");
  closeQuickPriceModal();
  renderAdminStats();
  renderAdminTable();
}

// Toggle Stock Status
function toggleStockStatus(id) {
  const product = getProductById(id);
  if (!product) return;

  const updatedStatus = !product.inStock;
  updateProduct(id, { inStock: updatedStatus });
  showToast(`Status changed to <strong>${updatedStatus ? 'In Stock' : 'Draft/Hidden'}</strong>`, "info");
  renderAdminTable();
}

// Confirm and Delete Product
function confirmDeleteProduct(id) {
  const product = getProductById(id);
  if (!product) return;

  if (confirm(`Are you sure you want to remove "${product.name}" from your boutique inventory?`)) {
    deleteProduct(id);
    showToast(`Deleted <strong>${product.name}</strong> from catalog.`, "info");
    renderAdminStats();
    renderAdminTable();
  }
}

// Export Inventory to JSON File (Backup)
function exportInventoryBackup() {
  const products = getProducts();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `aviora_inventory_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Inventory backup downloaded successfully!", "success");
}

// Import Inventory from JSON File
function importInventoryBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        saveAllProducts(imported);
        renderAdminStats();
        renderAdminTable();
        showToast(`Successfully restored ${imported.length} dresses!`, "success");
      } else {
        showToast("Invalid backup file format", "error");
      }
    } catch (err) {
      showToast("Error parsing JSON file", "error");
    }
  };
  reader.readAsText(file);
}

// Reset Catalog to Default Luxury Collection
function confirmResetCatalog() {
  if (confirm("Reset the boutique inventory to the default Aviora curated collection? (Any custom items added will be replaced)")) {
    resetToDefaultProducts();
    renderAdminStats();
    renderAdminTable();
    showToast("Catalog reset to default collection ✨", "success");
  }
}
