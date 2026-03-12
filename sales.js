// ================================================================
//  sales.js — StockPilot Sales (Cart-based, auto stock deduction)
// ================================================================

(async function () {

  const SIDEBAR = `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-title">⚙️ Joe Hardware<span class="logo-accent">and Motorparts</span></div>
        <div class="logo-sub">Hardware &amp; Motor Parts</div>
      </div>
      <nav class="sidebar-nav">
        <a href="dashboard.html"  class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
        <a href="products.html"   class="nav-item"><span class="nav-icon">📦</span> Products</a>
        <a href="sales.html"      class="nav-item active"><span class="nav-icon">🧾</span> Sales</a>
        <a href="supplies.html"   class="nav-item"><span class="nav-icon">🚚</span> Supplies</a>
        <a href="returns.html"    class="nav-item"><span class="nav-icon">↩️</span> Returns</a>
        <a href="stockouts.html"  class="nav-item"><span class="nav-icon">⚠️</span> Stock-Outs</a>
        <a href="customers.html"  class="nav-item"><span class="nav-icon">👥</span> Customers</a>
        <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
        <a href="suppliers.html"  class="nav-item"><span class="nav-icon">🏭</span> Suppliers</a>
      </nav>
      <div class="sidebar-footer">👤 Maria Santos</div>
    </aside>`;

  let SALES = [], CUSTOMERS = [], EMPLOYEES = [], PRODUCTS = [], filtered = [];

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { document.getElementById('modalSlot').innerHTML = ''; }
  function peso(n) { return '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 }); }

  // ── Table Rows ────────────────────────────────────────────────
  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="6" class="td-muted" style="text-align:center;padding:32px;">No sales found.</td></tr>`;
    return list.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.sale_date}</td>
        <td class="td-bold">${s.customer?.full_name || 'Walk-in'}</td>
        <td>${s.employee?.full_name || '—'}</td>
        <td>${s.item_count || '—'} item(s)</td>
        <td style="color:#22c55e;font-weight:700;">${peso(s.total_amount)}</td>
      </tr>`).join('');
  }

  function renderTable() {
    document.getElementById('sales-tbody').innerHTML = tableRows(filtered);
    document.getElementById('sales-count').textContent = `${filtered.length} sale${filtered.length !== 1 ? 's' : ''}`;
  }

  async function loadSales() {
    const { data } = await db.from('sale')
      .select('*, customer(full_name), employee(full_name), sale_item(sale_item_id)')
      .order('sale_date', { ascending: false })
      .order('sale_id',   { ascending: false });

    SALES = (data || []).map(s => ({ ...s, item_count: s.sale_item?.length || 0 }));
    filtered = [...SALES];
    renderTable();
  }

  async function loadLookups() {
    const [{ data: c }, { data: e }, { data: p }] = await Promise.all([
      db.from('customer').select('customer_id, full_name').order('full_name'),
      db.from('employee').select('employee_id, full_name').order('full_name'),
      db.from('product').select('product_id, product_name, price, quantity').order('product_name'),
    ]);
    CUSTOMERS = c || []; EMPLOYEES = e || []; PRODUCTS = p || [];
  }

  function applyFilters() {
    const q   = (document.getElementById('search-sales')?.value || '').toLowerCase();
    const emp = document.getElementById('filter-employee')?.value || '';
    filtered = SALES.filter(s => {
      const mQ = !q   || (s.customer?.full_name || '').toLowerCase().includes(q) || s.sale_date.includes(q);
      const mE = !emp || String(s.employee_id) === emp;
      return mQ && mE;
    });
    renderTable();
  }

  // ── New Sale Modal (Cart-based) ───────────────────────────────
  function openModal() {
    const today = new Date().toISOString().split('T')[0];
    let cart = []; // { product_id, product_name, quantity, unit_price, stock }

    function cartTotal() {
      return cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    }

    function renderCart() {
      const tbody = document.getElementById('cart-tbody');
      const totalEl = document.getElementById('cart-total');
      if (!cart.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">No items added yet.</td></tr>`;
      } else {
        tbody.innerHTML = cart.map((item, idx) => `
          <tr>
            <td style="font-weight:600;">${item.product_name}</td>
            <td>
              <input type="number" min="1" max="${item.stock}" value="${item.quantity}"
                style="width:65px;background:#1e2130;border:1px solid #2e3347;color:#fff;padding:4px 8px;border-radius:6px;text-align:center;"
                data-idx="${idx}" class="cart-qty-input"/>
            </td>
            <td>${peso(item.unit_price)}</td>
            <td style="color:#22c55e;font-weight:700;">${peso(item.quantity * item.unit_price)}</td>
            <td>
              <button class="btn-action" data-idx="${idx}" style="color:#f87171;" title="Remove" onclick="window._removeCartItem(${idx})">🗑️</button>
            </td>
          </tr>`).join('');

        // Attach qty change listeners
        tbody.querySelectorAll('.cart-qty-input').forEach(input => {
          input.addEventListener('change', function () {
            const idx = parseInt(this.dataset.idx);
            let val = parseInt(this.value);
            if (isNaN(val) || val < 1) val = 1;
            if (val > cart[idx].stock) { val = cart[idx].stock; showToast(`Max stock: ${cart[idx].stock}`, 'error'); }
            cart[idx].quantity = val;
            this.value = val;
            renderCart();
          });
        });
      }
      totalEl.textContent = peso(cartTotal());
    }

    // Expose remove function globally for inline onclick
    window._removeCartItem = function (idx) {
      cart.splice(idx, 1);
      renderCart();
    };

    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal" style="align-items:flex-start;padding-top:40px;">
        <div class="modal-box" style="max-width:680px;width:95%;">
          <div class="modal-header">
            <div class="modal-title">🧾 New Sale</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>

          <!-- Sale Info -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" id="f-date" type="date" value="${today}" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Customer</label>
              <select class="form-input" id="f-customer">
                <option value="">Walk-in</option>
                ${CUSTOMERS.map(c => `<option value="${c.customer_id}">${c.full_name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Employee</label>
              <select class="form-input" id="f-employee">
                ${EMPLOYEES.map(e => `<option value="${e.employee_id}">${e.full_name}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Add Product to Cart -->
          <div style="background:#1a1d2e;border:1px solid #2e3347;border-radius:10px;padding:14px;margin-bottom:16px;">
            <div style="font-size:13px;font-weight:700;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">Add Product</div>
            <div style="display:grid;grid-template-columns:1fr 80px auto;gap:10px;align-items:flex-end;">
              <div class="form-group" style="margin:0;">
                <label class="form-label">Product</label>
                <select class="form-input" id="f-product">
                  <option value="">Select a product...</option>
                  ${PRODUCTS.filter(p => p.quantity > 0).map(p => `<option value="${p.product_id}" data-price="${p.price}" data-stock="${p.quantity}">${p.product_name} (Stock: ${p.quantity})</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="margin:0;">
                <label class="form-label">Qty</label>
                <input class="form-input" id="f-qty" type="number" min="1" value="1" style="text-align:center;"/>
              </div>
              <button type="button" class="btn btn-red" id="btn-add-item" style="height:38px;white-space:nowrap;">+ Add</button>
            </div>
          </div>

          <!-- Cart Table -->
          <div style="margin-bottom:16px;">
            <div style="font-size:13px;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Cart</div>
            <div style="border:1px solid #2e3347;border-radius:10px;overflow:hidden;">
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:#1a1d2e;">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:var(--text-muted);">Product</th>
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:var(--text-muted);">Qty</th>
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:var(--text-muted);">Unit Price</th>
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:var(--text-muted);">Subtotal</th>
                    <th style="padding:10px 12px;"></th>
                  </tr>
                </thead>
                <tbody id="cart-tbody">
                  <tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">No items added yet.</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Total & Submit -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #2e3347;padding-top:16px;">
            <div style="font-size:22px;font-weight:800;color:#22c55e;">
              Total: <span id="cart-total">₱0.00</span>
            </div>
            <div style="display:flex;gap:10px;">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="button" class="btn btn-green" id="btn-save-sale">✔ Complete Sale</button>
            </div>
          </div>
        </div>
      </div>`;

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

    // Add item to cart
    document.getElementById('btn-add-item').addEventListener('click', () => {
      const sel = document.getElementById('f-product');
      const opt = sel.options[sel.selectedIndex];
      const product_id = parseInt(sel.value);
      if (!product_id) { showToast('Please select a product.', 'error'); return; }

      const qty = parseInt(document.getElementById('f-qty').value);
      const unit_price = parseFloat(opt.dataset.price);
      const stock = parseInt(opt.dataset.stock);
      const product_name = opt.text.split(' (Stock:')[0];

      if (isNaN(qty) || qty < 1) { showToast('Quantity must be at least 1.', 'error'); return; }

      // Check if already in cart
      const existing = cart.find(i => i.product_id === product_id);
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > stock) { showToast(`Not enough stock. Available: ${stock}`, 'error'); return; }
        existing.quantity = newQty;
      } else {
        if (qty > stock) { showToast(`Not enough stock. Available: ${stock}`, 'error'); return; }
        cart.push({ product_id, product_name, quantity: qty, unit_price, stock });
      }

      // Reset product selector
      sel.value = '';
      document.getElementById('f-qty').value = 1;
      renderCart();
      showToast(`${product_name} added to cart!`);
    });

    // Save sale
    document.getElementById('btn-save-sale').addEventListener('click', async () => {
      if (!cart.length) { showToast('Add at least one product.', 'error'); return; }

      const sale_date   = document.getElementById('f-date').value;
      const customer_id = document.getElementById('f-customer').value ? parseInt(document.getElementById('f-customer').value) : null;
      const employee_id = parseInt(document.getElementById('f-employee').value);
      const total_amount = cartTotal();

      const btn = document.getElementById('btn-save-sale');
      btn.textContent = '⏳ Saving...'; btn.disabled = true;

      // 1. Insert the sale
      const { data: saleData, error: saleError } = await db
        .from('sale')
        .insert({ sale_date, customer_id, employee_id, total_amount })
        .select('sale_id')
        .single();

      if (saleError) { showToast('Error creating sale.', 'error'); btn.textContent = '✔ Complete Sale'; btn.disabled = false; return; }

      const sale_id = saleData.sale_id;

      // 2. Insert all sale_items
      const saleItems = cart.map(item => ({
        sale_id,
        product_id: item.product_id,
        quantity:   item.quantity,
        unit_price: item.unit_price,
      }));

      const { error: itemsError } = await db.from('sale_item').insert(saleItems);
      if (itemsError) { showToast('Error saving sale items.', 'error'); btn.textContent = '✔ Complete Sale'; btn.disabled = false; return; }

      // 3. Deduct stock for each product
      for (const item of cart) {
        const product = PRODUCTS.find(p => p.product_id === item.product_id);
        if (product) {
          const newQty = product.quantity - item.quantity;
          await db.from('product').update({ quantity: newQty }).eq('product_id', item.product_id);
        }
      }

      closeModal();
      await loadLookups(); // refresh product stock
      await loadSales();
      showToast(`Sale saved! Total: ${peso(total_amount)}`);
    });
  }

  // ── Render Shell ──────────────────────────────────────────────
  document.getElementById('app').innerHTML = `
    <div class="app">${SIDEBAR}
      <main class="main"><div id="pageContent">
        <div class="page-header">
          <h1 class="page-title">Sales</h1>
          <button class="btn btn-green" id="btn-add">+ New Sale</button>
        </div>
        <div class="toolbar" style="margin-bottom:16px;">
          <input class="search-input" id="search-sales" type="text" placeholder="🔍 Search customer or date..."/>
          <select class="filter-select" id="filter-employee"><option value="">All Employees</option></select>
          <span id="sales-count" style="margin-left:auto;font-size:13px;color:var(--text-muted);font-weight:600;">Loading...</span>
        </div>
        <div class="card" style="padding:0;overflow:hidden;">
          <div class="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Date</th><th>Customer</th><th>Employee</th><th>Items</th><th>Total</th></tr></thead>
              <tbody id="sales-tbody"><tr><td colspan="6" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div></main>
    </div>
    <div id="modalSlot"></div>
    <div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>`;

  await loadLookups();
  document.getElementById('filter-employee').innerHTML = `<option value="">All Employees</option>${EMPLOYEES.map(e => `<option value="${e.employee_id}">${e.full_name}</option>`).join('')}`;
  await loadSales();

  document.getElementById('btn-help').addEventListener('click', () => showToast('💡 Add products to cart, then complete the sale.'));
  document.getElementById('btn-add').addEventListener('click', openModal);
  document.getElementById('search-sales').addEventListener('input', applyFilters);
  document.getElementById('filter-employee').addEventListener('change', applyFilters);

})();