// ================================================================
//  dashboard.js — Joe Hardware & Motorparts
// ================================================================

(async function () {

  renderShell('dashboard');
  document.getElementById('header-title').textContent = 'Dashboard';

  const pc = document.getElementById('pageContent');
  function peso(n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 }); }

  function showToast(msg, type = 'success') {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }

  pc.innerHTML = `
    <div class="page-header">
      <div>
        <div class="dashboard-date" id="dashboard-date"></div>
        <h1 class="page-title">Dashboard</h1>
        <div class="page-sub">Executive overview of store operations</div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn-ghost" id="btn-refresh">&#8635; Refresh</button>
        <button class="btn btn-amber" id="btn-quick-sale">+ Quick Sale</button>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Today's Sales <span class="kpi-icon">&#128178;</span></div><div class="kpi-value" id="kpi-sales">—</div><div class="kpi-trend" id="kpi-trend"></div></div>
      <div class="kpi-card"><div class="kpi-label">Total Products <span class="kpi-icon">&#128230;</span></div><div class="kpi-value" id="kpi-products">—</div></div>
      <div class="kpi-card"><div class="kpi-label">Pending Supplies <span class="kpi-icon">&#128666;</span></div><div class="kpi-value" id="kpi-supplies">—</div></div>
      <div class="kpi-card"><div class="kpi-label">Returns Today <span class="kpi-icon">&#8617;</span></div><div class="kpi-value" id="kpi-returns">—</div></div>
    </div>

    <div class="stock-overview-card">
      <div class="stock-overview-title">Stock Level Overview</div>
      <div class="stock-bars-grid" id="stock-bars-grid"><div class="empty-state">Loading...</div></div>
    </div>

    <div class="low-stock-section">
      <div class="section-title">&#9888; Low Stock Alerts</div>
      <div class="low-stock-grid" id="low-stock-grid"><div class="empty-state">Loading...</div></div>
    </div>

    <div class="activity-card">
      <div class="section-title" style="margin-bottom:6px;">Recent Activity</div>
      <div id="recent-activity"><div class="empty-state">Loading...</div></div>
    </div>

    <div id="toast" class="toast"></div>`;

  document.getElementById('dashboard-date').textContent =
    new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  async function loadDashboard() {
    const { count: totalProducts } = await db.from('product').select('*', { count:'exact', head:true });
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: todaySales } = await db.from('sale').select('total_amount').gte('sale_date', todayStr).lte('sale_date', todayStr + 'T23:59:59.999Z');
    const todayTotal = (todaySales || []).reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
    const { data: todayReturns } = await db.from('return').select('return_id').gte('return_date', todayStr);
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
    const { count: pendingSupplies } = await db.from('supply').select('*', { count:'exact', head:true }).gte('supply_date', weekAgo);

    document.getElementById('kpi-sales').textContent    = peso(todayTotal);
    document.getElementById('kpi-products').textContent = (totalProducts || 0).toLocaleString();
    document.getElementById('kpi-supplies').textContent = pendingSupplies || 0;
    document.getElementById('kpi-returns').textContent  = (todayReturns || []).length;

    const { data: allProducts } = await db.from('product').select('product_id, product_name, quantity, reorder_level, category(category_name)').order('product_name');
    const products = allProducts || [];

    // Stock bars
    const catMap = {};
    products.forEach(p => {
      const cat = p.category?.category_name || 'Other';
      if (!catMap[cat]) catMap[cat] = { qty: 0, reorder: 0 };
      catMap[cat].qty     += p.quantity;
      catMap[cat].reorder += p.reorder_level;
    });
    const cats = Object.entries(catMap).slice(0, 6);
    document.getElementById('stock-bars-grid').innerHTML = cats.length
      ? cats.map(([name, data]) => {
          const pct = Math.min(100, Math.round((data.qty / ((data.reorder * 3) || 100)) * 100));
          const colorClass = pct <= 30 ? 'low' : pct <= 60 ? 'medium' : 'good';
          return `<div class="stock-bar-item">
            <div class="stock-bar-header"><div class="stock-bar-label">${name}</div><div class="stock-bar-pct">${pct}%</div></div>
            <div class="stock-bar-track"><div class="stock-bar-fill ${colorClass}" style="width:${pct}%;"></div></div>
          </div>`;
        }).join('')
      : `<div class="empty-state">No products found.</div>`;

    // Low stock cards
    const lowItems = products.filter(p => p.quantity <= p.reorder_level).sort((a,b) => a.quantity - b.quantity).slice(0, 4);
    document.getElementById('low-stock-grid').innerHTML = lowItems.length
      ? lowItems.map(p => {
          const pct = p.reorder_level > 0 ? Math.min(100, Math.round((p.quantity / p.reorder_level) * 100)) : 0;
          const isOut = p.quantity <= 0;
          return `<div class="low-stock-card">
            ${isOut ? '<div class="out-dot"></div>' : ''}
            <div class="low-stock-name">${p.product_name}</div>
            <div class="low-stock-cat">${p.category?.category_name || ''}</div>
            <div class="low-stock-bar-track"><div class="low-stock-bar-fill" style="width:${pct}%;"></div></div>
            <div class="low-stock-stats">
              <div class="low-stock-stat"><div class="low-stock-stat-label">Current</div><div class="low-stock-stat-val ${isOut?'danger':''}">${p.quantity}</div></div>
              <div class="low-stock-stat" style="text-align:right;"><div class="low-stock-stat-label">Reorder</div><div class="low-stock-stat-val warn">${p.reorder_level}</div></div>
            </div>
            <button class="btn-reorder" onclick="window.location.href='supply-suppliers.html'">Reorder</button>
          </div>`;
        }).join('')
      : `<div class="empty-state" style="grid-column:1/-1;">&#10003; All stock levels OK</div>`;

    // Recent activity
    const [{ data: sales }, { data: returns }] = await Promise.all([
      db.from('sale').select('sale_id, sale_date, total_amount, sale_item(quantity, product(product_name)), employee(full_name)').order('sale_date',{ascending:false}).order('sale_id',{ascending:false}).limit(6),
      db.from('return').select('return_id, return_date, quantity, sale_item(product(product_name))').order('return_date',{ascending:false}).limit(3),
    ]);
    const activity = [
      ...(sales||[]).flatMap(s => (s.sale_item||[]).slice(0,1).map(si => ({ type:'SALE', product: si.product?.product_name||'?', qty: -(si.quantity), time: s.sale_date, by: s.employee?.full_name||'Staff', ts: s.sale_date+String(s.sale_id).padStart(8,'0') }))),
      ...(returns||[]).map(r => ({ type:'RETURN', product: r.sale_item?.product?.product_name||'?', qty: r.quantity, time: r.return_date, by: 'Staff', ts: r.return_date+String(r.return_id).padStart(8,'0') })),
    ].sort((a,b) => b.ts.localeCompare(a.ts)).slice(0,10);

    document.getElementById('recent-activity').innerHTML = activity.length
      ? activity.map(a => `<div class="activity-row">
          <span class="activity-type-badge">${a.type}</span>
          <div class="activity-product">${a.product}</div>
          <div class="activity-qty ${a.qty<0?'neg':'pos'}">${a.qty<0?a.qty:'+'+a.qty}</div>
          <div class="activity-meta">${a.time} &nbsp; ${a.by}</div>
        </div>`).join('')
      : `<div class="empty-state">No recent activity.</div>`;
  }

  document.getElementById('btn-quick-sale').addEventListener('click', () => { window.location.href = 'products.html'; });
  document.getElementById('btn-refresh').addEventListener('click', async () => { showToast('Refreshing...'); await loadDashboard(); showToast('Refreshed!'); });

  await loadDashboard();

})();