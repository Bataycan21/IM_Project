// ================================================================
//  products.js — StockPilot Products
//  Renders: sidebar + products table + add product modal + events
// ================================================================

(function () {

  // ── Data ──────────────────────────────────────────────────────
  const PRODUCTS = [
    { id: 1, name: 'Wireless Mouse',     category: 'Accessories', brand: 'Logitech', unit: 'pcs', qty: 145, reorder: 50,  price: 25.99  },
    { id: 2, name: 'USB Cable 2m',       category: 'Cables',      brand: 'Anker',    unit: 'pcs', qty: 12,  reorder: 30,  price: 8.50   },
    { id: 3, name: 'Keyboard Mechanical',category: 'Accessories', brand: 'Corsair',  unit: 'pcs', qty: 8,   reorder: 20,  price: 89.99  },
    { id: 4, name: 'HDMI Cable 1.5m',    category: 'Cables',      brand: 'Belkin',   unit: 'pcs', qty: 78,  reorder: 40,  price: 12.99  },
    { id: 5, name: 'Webcam HD',          category: 'Electronics', brand: 'Logitech', unit: 'pcs', qty: 32,  reorder: 15,  price: 65.00  },
    { id: 6, name: 'USB Hub 4-Port',     category: 'Accessories', brand: 'Anker',    unit: 'pcs', qty: 5,   reorder: 25,  price: 19.99  },
    { id: 7, name: 'Monitor 24"',        category: 'Electronics', brand: 'Dell',     unit: 'pcs', qty: 18,  reorder: 10,  price: 199.99 },
    { id: 8, name: 'External SSD 1TB',   category: 'Storage',     brand: 'Samsung',  unit: 'pcs', qty: 42,  reorder: 20,  price: 129.99 },
  ];

  const CATEGORIES = [...new Set(PRODUCTS.map(p => p.category))];
  const BRANDS     = [...new Set(PRODUCTS.map(p => p.brand))];

  let filtered = [...PRODUCTS];
  let nextId   = PRODUCTS.length + 1;

  // ── Helpers ───────────────────────────────────────────────────
  function isLow(p) { return p.qty <= p.reorder; }

  function statusBadge(p) {
    return isLow(p)
      ? `<span class="badge badge-red">Low Stock</span>`
      : `<span class="badge badge-green">In Stock</span>`;
  }

  function qtyCell(p) {
    return isLow(p)
      ? `<span style="color:#b84040;font-weight:700;">${p.qty}</span>`
      : `${p.qty}`;
  }

  function tableRows(list) {
    if (!list.length) return `
      <tr>
        <td colspan="9" class="td-muted" style="text-align:center;padding:32px;">
          No products found.
        </td>
      </tr>`;
    return list.map((p, i) => `
      <tr data-id="${p.id}">
        <td>${i + 1}</td>
        <td class="td-bold">${p.name}</td>
        <td>${p.category}</td>
        <td>${p.brand}</td>
        <td>${p.unit}</td>
        <td>${qtyCell(p)}</td>
        <td>${p.reorder}</td>
        <td>₱${p.price.toFixed(2)}</td>
        <td>${statusBadge(p)}</td>
      </tr>
    `).join('');
  }

  function renderTable() {
    document.getElementById('product-tbody').innerHTML = tableRows(filtered);
  }

  // ── Toast ─────────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} toast-show`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('toast-show'), 2800);
  }

  // ── Close Modal ───────────────────────────────────────────────
  function closeModal() {
    document.getElementById('modalSlot').innerHTML = '';
  }

  // ── Open Add Product Modal ────────────────────────────────────
  function openAddModal(prefill = {}) {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">📦 Add New Product</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="modal-form">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group" style="grid-column:1/-1;">
                <label class="form-label">Product Name</label>
                <input class="form-input" id="f-name" type="text" placeholder="e.g. Wireless Mouse" value="${prefill.name||''}" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <input class="form-input" id="f-category" type="text" placeholder="e.g. Electronics" value="${prefill.category||''}" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Brand</label>
                <input class="form-input" id="f-brand" type="text" placeholder="e.g. Logitech" value="${prefill.brand||''}" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Unit</label>
                <input class="form-input" id="f-unit" type="text" placeholder="e.g. pcs" value="${prefill.unit||'pcs'}" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Price (₱)</label>
                <input class="form-input" id="f-price" type="number" min="0" step="0.01" placeholder="0.00" value="${prefill.price||''}" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Quantity</label>
                <input class="form-input" id="f-qty" type="number" min="0" placeholder="0" value="${prefill.qty||''}" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Reorder Level</label>
                <input class="form-input" id="f-reorder" type="number" min="0" placeholder="0" value="${prefill.reorder||''}" required/>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-blue">Save Product</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    document.getElementById('modal-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const name    = document.getElementById('f-name').value.trim();
      const category= document.getElementById('f-category').value.trim();
      const brand   = document.getElementById('f-brand').value.trim();
      const unit    = document.getElementById('f-unit').value.trim();
      const price   = parseFloat(document.getElementById('f-price').value);
      const qty     = parseInt(document.getElementById('f-qty').value);
      const reorder = parseInt(document.getElementById('f-reorder').value);

      if (!name || !category || !brand || !unit || isNaN(price) || isNaN(qty) || isNaN(reorder)) {
        showToast('Please fill in all fields.', 'error');
        return;
      }

      const newProduct = { id: nextId++, name, category, brand, unit, qty, reorder, price };
      PRODUCTS.push(newProduct);
      applyFilters();
      closeModal();
      showToast(`"${name}" added successfully!`);
    });
  }

  // ── Filter & Search ───────────────────────────────────────────
  function applyFilters() {
    const q   = (document.getElementById('search-products')?.value || '').toLowerCase();
    const cat = document.getElementById('filter-category')?.value || '';
    const brd = document.getElementById('filter-brand')?.value || '';

    filtered = PRODUCTS.filter(p => {
      const matchQ   = !q   || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      const matchCat = !cat || p.category === cat;
      const matchBrd = !brd || p.brand === brd;
      return matchQ && matchCat && matchBrd;
    });

    renderTable();
    document.getElementById('product-count').textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
  }

  // ── Render App ────────────────────────────────────────────────
  document.getElementById('app').innerHTML = `
    <div class="app">

      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-title">📦 StockPilot</div>
          <div class="logo-sub">Inventory Management</div>
        </div>
        <nav class="sidebar-nav">
          <a href="dashboard.html"  class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
          <a href="products.html"   class="nav-item active"><span class="nav-icon">📦</span> Products</a>
          <a href="sales.html"      class="nav-item"><span class="nav-icon">🧾</span> Sales</a>
          <a href="supplies.html"   class="nav-item"><span class="nav-icon">🚚</span> Supplies</a>
          <a href="returns.html"    class="nav-item"><span class="nav-icon">↩️</span> Returns</a>
          <a href="stockouts.html"  class="nav-item"><span class="nav-icon">⚠️</span> Stock-Outs</a>
          <a href="customers.html"  class="nav-item"><span class="nav-icon">👥</span> Customers</a>
          <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
          <a href="suppliers.html"  class="nav-item"><span class="nav-icon">🏭</span> Suppliers</a>
        </nav>
        <div class="sidebar-footer">👤 Maria Santos</div>
      </aside>

      <!-- MAIN -->
      <main class="main">
        <div id="pageContent">

          <!-- Page Header -->
          <div class="page-header">
            <h1 class="page-title">Products</h1>
            <button class="btn btn-blue" id="btn-add-product">+ Add Product</button>
          </div>

          <!-- Toolbar -->
          <div class="toolbar" style="margin-bottom:16px;">
            <input class="search-input" id="search-products" type="text" placeholder="🔍 Search products..."/>
            <select class="filter-select" id="filter-category">
              <option value="">All Categories</option>
              ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <select class="filter-select" id="filter-brand">
              <option value="">All Brands</option>
              ${BRANDS.map(b => `<option value="${b}">${b}</option>`).join('')}
            </select>
            <span id="product-count" style="margin-left:auto;font-size:13px;color:#aaa;font-weight:600;">
              ${PRODUCTS.length} products
            </span>
          </div>

          <!-- Table -->
          <div class="card" style="padding:0;overflow:hidden;">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Reorder Level</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="product-tbody">
                  ${tableRows(PRODUCTS)}
                </tbody>
              </table>
            </div>
          </div>

        </div><!-- end pageContent -->
      </main>

    </div><!-- end app -->

    <!-- Modal Slot -->
    <div id="modalSlot"></div>

    <!-- Toast -->
    <div id="toast" class="toast"></div>

    <!-- Help FAB -->
    <button class="fab-help" id="btn-help">?</button>
  `;

  // ── Events ────────────────────────────────────────────────────

  document.getElementById('btn-help').addEventListener('click', () => {
    showToast('💡 Use the sidebar to navigate between modules.');
  });

  document.getElementById('btn-add-product').addEventListener('click', () => {
    openAddModal();
  });

  document.getElementById('search-products').addEventListener('input', applyFilters);
  document.getElementById('filter-category').addEventListener('change', applyFilters);
  document.getElementById('filter-brand').addEventListener('change', applyFilters);

})();