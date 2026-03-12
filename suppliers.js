// ================================================================
//  suppliers.js — StockPilot Suppliers
// ================================================================

(function () {

  // ── Data ──────────────────────────────────────────────────────
  const SUPPLIERS = [
    { id: 1, name: 'Tech Distributors Ltd.',    contact: '+1 (555) 111-2222', address: '123 Tech Park, Silicon Valley, CA 94025'     },
    { id: 2, name: 'Global Electronics Supply', contact: '+1 (555) 222-3333', address: '456 Industrial Blvd, Austin, TX 78701'       },
    { id: 3, name: 'Premium Parts Inc.',         contact: '+1 (555) 333-4444', address: '789 Commerce St, Seattle, WA 98101'          },
    { id: 4, name: 'Component Wholesale',        contact: '+1 (555) 444-5555', address: '321 Supply Ave, Portland, OR 97201'          },
    { id: 5, name: 'Digital Components Co.',     contact: '+1 (555) 555-6666', address: '654 Hardware Way, Denver, CO 80202'          },
    { id: 6, name: 'Electronics Direct',         contact: '+1 (555) 666-7777', address: '987 Distribution Dr, Phoenix, AZ 85001'     },
  ];

  let filtered = [...SUPPLIERS];
  let nextId   = SUPPLIERS.length + 1;

  // ── Helpers ───────────────────────────────────────────────────
  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="4" class="td-muted" style="text-align:center;padding:32px;">No suppliers found.</td></tr>`;
    return list.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="td-bold">${s.name}</td>
        <td>${s.contact}</td>
        <td class="td-muted">${s.address}</td>
      </tr>
    `).join('');
  }

  function renderTable() {
    document.getElementById('suppliers-tbody').innerHTML = tableRows(filtered);
    document.getElementById('suppliers-count').textContent = `${filtered.length} supplier${filtered.length !== 1 ? 's' : ''}`;
  }

  // ── Toast ─────────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} toast-show`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('toast-show'), 2800);
  }

  function closeModal() {
    document.getElementById('modalSlot').innerHTML = '';
  }

  // ── Open Add Supplier Modal ───────────────────────────────────
  function openModal() {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">🏭 Add Supplier</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="modal-form">
            <div class="form-group">
              <label class="form-label">Supplier Name</label>
              <input class="form-input" id="f-name" type="text" placeholder="e.g. Tech Distributors Ltd." required/>
            </div>
            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <input class="form-input" id="f-contact" type="text" placeholder="e.g. +1 (555) 000-0000" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Address</label>
              <input class="form-input" id="f-address" type="text" placeholder="e.g. 123 Main St, City, ST 00000" required/>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-blue">Save Supplier</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });

    document.getElementById('modal-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const name    = document.getElementById('f-name').value.trim();
      const contact = document.getElementById('f-contact').value.trim();
      const address = document.getElementById('f-address').value.trim();

      if (!name || !contact || !address) { showToast('Please fill in all fields.', 'error'); return; }

      SUPPLIERS.push({ id: nextId++, name, contact, address });
      filtered = [...SUPPLIERS];
      applyFilters();
      closeModal();
      showToast(`"${name}" added!`);
    });
  }

  // ── Filters ───────────────────────────────────────────────────
  function applyFilters() {
    const q = (document.getElementById('search-suppliers')?.value || '').toLowerCase();
    filtered = SUPPLIERS.filter(s =>
      !q || s.name.toLowerCase().includes(q) || s.contact.includes(q) || s.address.toLowerCase().includes(q)
    );
    renderTable();
  }

  // ── Render ────────────────────────────────────────────────────
  document.getElementById('app').innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-title">📦 StockPilot</div>
          <div class="logo-sub">Inventory Management</div>
        </div>
        <nav class="sidebar-nav">
          <a href="dashboard.html"  class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
          <a href="products.html"   class="nav-item"><span class="nav-icon">📦</span> Products</a>
          <a href="sales.html"      class="nav-item"><span class="nav-icon">🧾</span> Sales</a>
          <a href="supplies.html"   class="nav-item"><span class="nav-icon">🚚</span> Supplies</a>
          <a href="returns.html"    class="nav-item"><span class="nav-icon">↩️</span> Returns</a>
          <a href="stockouts.html"  class="nav-item"><span class="nav-icon">⚠️</span> Stock-Outs</a>
          <a href="customers.html"  class="nav-item"><span class="nav-icon">👥</span> Customers</a>
          <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
          <a href="suppliers.html"  class="nav-item active"><span class="nav-icon">🏭</span> Suppliers</a>
        </nav>
        <div class="sidebar-footer">👤 Maria Santos</div>
      </aside>

      <main class="main">
        <div id="pageContent">
          <div class="page-header">
            <h1 class="page-title">Suppliers</h1>
            <button class="btn btn-blue" id="btn-add">+ Add Supplier</button>
          </div>
          <div class="toolbar" style="margin-bottom:16px;">
            <input class="search-input" id="search-suppliers" type="text" placeholder="🔍 Search name, contact, or address..."/>
            <span id="suppliers-count" style="margin-left:auto;font-size:13px;color:#aaa;font-weight:600;">${SUPPLIERS.length} suppliers</span>
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Supplier Name</th><th>Contact</th><th>Address</th></tr>
                </thead>
                <tbody id="suppliers-tbody">${tableRows(SUPPLIERS)}</tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div id="modalSlot"></div>
    <div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>
  `;

  document.getElementById('btn-help').addEventListener('click', () => showToast('💡 Use the sidebar to navigate between modules.'));
  document.getElementById('btn-add').addEventListener('click', openModal);
  document.getElementById('search-suppliers').addEventListener('input', applyFilters);

})();