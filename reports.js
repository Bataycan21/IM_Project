// ================================================================
//  reports.js — Joe Hardware & Motorparts
// ================================================================

(async function () {

  renderShell('reports');
  document.getElementById('header-title').textContent = 'Reports & Analytics';

  const pc = document.getElementById('pageContent');
  let activeTab = 'sales';
  let charts = {};

  function showToast(msg, type = 'success') {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

  const CHART_DEFAULTS = {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888', font: { family: "'Barlow', sans-serif", size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888', font: { family: "'Barlow', sans-serif", size: 11 } } },
    },
    maintainAspectRatio: false, responsive: true,
  };

  pc.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Reports &amp; Analytics</h1>
        <div class="page-sub">Business intelligence and performance metrics</div>
      </div>
      <button id="btn-export-excel" class="btn btn-amber" style="gap:8px;align-items:center;display:inline-flex;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <polyline points="9 14 12 17 15 14"/>
        </svg>
        Download Excel Report
      </button>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:24px;flex-wrap:wrap;">
      <button class="report-tab active" id="rtab-sales"     onclick="window._switchReport('sales')">Sales Report</button>
      <button class="report-tab"        id="rtab-inventory" onclick="window._switchReport('inventory')">Inventory Report</button>
      <button class="report-tab"        id="rtab-supply"    onclick="window._switchReport('supply')">Supply Report</button>
      <button class="report-tab"        id="rtab-employee"  onclick="window._switchReport('employee')">Employee Performance</button>
    </div>
    <div id="panel-sales"></div>
    <div id="panel-inventory" style="display:none;"></div>
    <div id="panel-supply"    style="display:none;"></div>
    <div id="panel-employee"  style="display:none;"></div>
    <div id="toast" class="toast"></div>`;

  const style = document.createElement('style');
  style.textContent = `
    .report-tab{padding:7px 16px;border-radius:20px;border:none;font-family:'Barlow',sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;cursor:pointer;background:transparent;color:var(--text-muted);transition:all 0.15s;}
    .report-tab:hover{color:var(--text-sub);}
    .report-tab.active{background:var(--amber);color:#000;}
    #month-picker{background:#1a1a1a;color:#fff;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 12px;font-family:'Barlow',sans-serif;font-size:13px;cursor:pointer;outline:none;}
    #month-picker:hover{border-color:var(--amber);}
  `;
  document.head.appendChild(style);

  window._switchReport = function (tab) {
    activeTab = tab;
    ['sales','inventory','supply','employee'].forEach(t => {
      document.getElementById(`panel-${t}`).style.display = t === tab ? 'block' : 'none';
      document.getElementById(`rtab-${t}`).classList.toggle('active', t === tab);
    });
    loadTab(tab);
  };

  async function loadTab(tab) {
    if (tab === 'sales')     await loadSalesReport();
    if (tab === 'inventory') await loadInventoryReport();
    if (tab === 'supply')    await loadSupplyReport();
    if (tab === 'employee')  await loadEmployeeReport();
  }

  async function loadSalesReport(selectedMonth) {
    const now = new Date();
    const curM = selectedMonth || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    // Build month options — current month going back 12 months
    const monthOptions = Array.from({length:12}, (_,i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleString('en-PH', { month:'long', year:'numeric' });
      return `<option value="${val}" ${val===curM?'selected':''}>${label}</option>`;
    }).join('');

    const panel = document.getElementById('panel-sales');
    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <label style="font-family:'Barlow',sans-serif;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Viewing Month:</label>
        <select id="month-picker">${monthOptions}</select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="card"><div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;margin-bottom:16px;">Top Selling Products <span style="font-size:11px;color:var(--amber);font-weight:600;">(by Sales ₱)</span></div><div style="height:300px;"><canvas id="chart-top-products"></canvas></div></div>
        <div class="card"><div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;margin-bottom:16px;">Sales by Category</div><div style="height:300px;display:flex;align-items:center;justify-content:center;"><canvas id="chart-sales-cat"></canvas></div></div>
      </div>`;

    document.getElementById('month-picker').addEventListener('change', (e) => {
      destroyChart('top-products');
      destroyChart('sales-cat');
      loadSalesReport(e.target.value);
    });

    // Fetch all sales + items then filter by selected month
    const { data: allSales } = await db.from('sale').select('sale_id,sale_date');
    const { data: allSaleItems } = await db.from('sale_item').select('quantity,unit_price,sale_id,product_id,product(product_name,category(category_name))');

    const saleIdsInMonth = new Set((allSales||[]).filter(s => (s.sale_date||'').startsWith(curM)).map(s => s.sale_id));
    const saleItems = (allSaleItems||[]).filter(si => saleIdsInMonth.has(si.sale_id));

    // Top products by ₱ sales
    const productTotals = {};
    saleItems.forEach(si => {
      const name = si.product?.product_name || 'Unknown';
      productTotals[name] = (productTotals[name]||0) + ((si.quantity||0) * parseFloat(si.unit_price||0));
    });
    const sorted = Object.entries(productTotals).sort((a,b) => b[1]-a[1]).slice(0,5);

    // Category totals by ₱ sales
    const catTotals = {};
    saleItems.forEach(si => {
      const cat = si.product?.category?.category_name || 'Other';
      catTotals[cat] = (catTotals[cat]||0) + ((si.quantity||0) * parseFloat(si.unit_price||0));
    });
    const catEntries = Object.entries(catTotals);
    const PIE_COLORS = ['#f5a623','#4caf50','#2196f3','#e53935','#9c27b0','#00bcd4'];

    destroyChart('top-products');
    destroyChart('sales-cat');

    const ctx1 = document.getElementById('chart-top-products')?.getContext('2d');
    if (ctx1 && sorted.length) {
      charts['top-products'] = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: sorted.map(([n]) => n),
          datasets: [{ data: sorted.map(([,v]) => v), backgroundColor: '#f5a623', borderRadius: 4, borderSkipped: false }]
        },
        options: {
          ...CHART_DEFAULTS,
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888', font: { family: "'Barlow',sans-serif", size: 11 } } },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#888',
                font: { family: "'Barlow',sans-serif", size: 11 },
                callback: (v) => '₱' + v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ' ₱' + ctx.parsed.y.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
            }
          }
        }
      });
    } else if (ctx1) {
      ctx1.canvas.parentElement.innerHTML = `<div class="empty-state">No sales data for this month.</div>`;
    }

    const ctx2 = document.getElementById('chart-sales-cat')?.getContext('2d');
    if (ctx2 && catEntries.length) {
      charts['sales-cat'] = new Chart(ctx2, {
        type: 'pie',
        data: {
          labels: catEntries.map(([n]) => n),
          datasets: [{ data: catEntries.map(([,v]) => v), backgroundColor: PIE_COLORS, borderWidth: 0 }]
        },
        options: {
          maintainAspectRatio: false, responsive: true,
          plugins: {
            legend: { display: true, position: 'right', labels: { color: '#888', font: { family: "'Barlow',sans-serif", size: 11 }, boxWidth: 12 } },
            tooltip: {
              callbacks: {
                label: (ctx) => ' ₱' + ctx.parsed.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
            }
          }
        }
      });
    } else if (ctx2) {
      ctx2.canvas.parentElement.innerHTML = `<div class="empty-state">No category data for this month.</div>`;
    }
  }

  async function loadInventoryReport() {
    const panel = document.getElementById('panel-inventory');
    panel.innerHTML = `<div class="card" style="padding:0;overflow:hidden;"><div style="padding:20px 22px 0;"><div style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;margin-bottom:16px;">Low Stock Products</div></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Reorder Level</th><th>Status</th></tr></thead><tbody id="inv-tbody"><tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody></table></div></div>`;
    const { data: all } = await db.from('product').select('product_name,quantity,reorder_level,category(category_name)').order('quantity');
    const low = (all||[]).filter(p => p.quantity <= p.reorder_level);
    const tbody = document.getElementById('inv-tbody');
    if (!low.length) { tbody.innerHTML = `<tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">&#10003; All products are well stocked.</td></tr>`; return; }
    tbody.innerHTML = low.map(p => {
      const isOut = p.quantity <= 0;
      const badge = isOut
        ? `<span style="background:#3a0a0a;color:#e53935;border:1px solid rgba(229,57,53,0.3);border-radius:4px;padding:3px 8px;font-size:10px;font-weight:800;text-transform:uppercase;">OUT</span>`
        : `<span style="background:#3a2a0a;color:#f5a623;border:1px solid rgba(245,166,35,0.3);border-radius:4px;padding:3px 8px;font-size:10px;font-weight:800;text-transform:uppercase;">LOW</span>`;
      return `<tr><td style="font-weight:600;color:#fff;">${p.product_name}</td><td style="color:var(--text-muted);">${p.category?.category_name||'—'}</td><td style="color:var(--amber);font-weight:700;">${p.quantity}</td><td style="color:var(--text-sub);">${p.reorder_level}</td><td>${badge}</td></tr>`;
    }).join('');
  }

  async function loadSupplyReport() {
    const panel = document.getElementById('panel-supply');
    panel.innerHTML = `<div class="card"><div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;margin-bottom:16px;">Spending by Supplier</div><div style="height:320px;"><canvas id="chart-supply-spend"></canvas></div></div>`;
    const { data: supplies } = await db.from('supply').select('total_amount,supplier(supplier_name)');
    const spendMap = {};
    (supplies||[]).forEach(s => { const name = s.supplier?.supplier_name||'Unknown'; spendMap[name] = (spendMap[name]||0) + parseFloat(s.total_amount||0); });
    const entries = Object.entries(spendMap).sort((a,b) => b[1]-a[1]);
    destroyChart('supply-spend');
    const ctx = document.getElementById('chart-supply-spend')?.getContext('2d');
    if (!ctx) return;
    if (!entries.length) { ctx.canvas.parentElement.innerHTML = `<div class="empty-state">No supply data yet.</div>`; return; }
    charts['supply-spend'] = new Chart(ctx, { type:'bar', data:{ labels:entries.map(([n])=>n), datasets:[{ data:entries.map(([,v])=>v), backgroundColor:'#4caf50', borderRadius:4, borderSkipped:false }] }, options:{ ...CHART_DEFAULTS, indexAxis:'y', scales:{ x:{ grid:{ color:'rgba(255,255,255,0.05)' }, ticks:{ color:'#888', font:{ family:"'Barlow',sans-serif", size:11 } } }, y:{ grid:{ display:false }, ticks:{ color:'#888', font:{ family:"'Barlow',sans-serif", size:11 } } } } } });
  }

  async function loadEmployeeReport() {
    const panel = document.getElementById('panel-employee');
    panel.innerHTML = `<div class="card"><div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;margin-bottom:16px;">Sales by Employee</div><div style="height:320px;"><canvas id="chart-emp-sales"></canvas></div></div>`;
    const { data: sales } = await db.from('sale').select('total_amount,employee(full_name)');
    const empMap = {};
    (sales||[]).forEach(s => { const name = s.employee?.full_name||'Unknown'; empMap[name] = (empMap[name]||0) + parseFloat(s.total_amount||0); });
    const entries = Object.entries(empMap).sort((a,b) => b[1]-a[1]);
    destroyChart('emp-sales');
    const ctx = document.getElementById('chart-emp-sales')?.getContext('2d');
    if (!ctx) return;
    if (!entries.length) { ctx.canvas.parentElement.innerHTML = `<div class="empty-state">No employee sales data yet.</div>`; return; }
    charts['emp-sales'] = new Chart(ctx, { type:'bar', data:{ labels:entries.map(([n])=>n), datasets:[{ data:entries.map(([,v])=>v), backgroundColor:'#f5a623', borderRadius:4, borderSkipped:false }] }, options:{...CHART_DEFAULTS} });
  }

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
  script.onload = () => loadTab('sales');
  document.head.appendChild(script);

  // ================================================================
  //  EXCEL EXPORT — Monthly Sales Report (uses selected month)
  // ================================================================

  document.getElementById('btn-export-excel').addEventListener('click', async () => {
    const btn = document.getElementById('btn-export-excel');
    btn.disabled = true;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Fetching data...`;
    const spinStyle = document.createElement('style');
    spinStyle.textContent = `@keyframes spin{to{transform:rotate(360deg)}}`;
    document.head.appendChild(spinStyle);

    try {
      if (!window.XLSX) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Building Excel...`;

      const now        = new Date();
      // Use selected month from picker if available, else current month
      const picker     = document.getElementById('month-picker');
      const curM       = picker ? picker.value : `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      const [yr, mo]   = curM.split('-');
      const monthLabel = new Date(parseInt(yr), parseInt(mo)-1, 1).toLocaleString('en-PH', { month:'long', year:'numeric' });
      const COGS_RATE  = 0.60;

      // ── Fetch all needed data ──
      const [
        { data: allSales },
        { data: allSaleItems },
        { data: allReturns },
        { data: allProducts },
        { data: allEmployees },
      ] = await Promise.all([
        db.from('sale').select('sale_id,sale_date,total_amount,employee(full_name),customer(full_name)'),
        db.from('sale_item').select('sale_item_id,sale_id,product_id,quantity,unit_price,product(product_name,category(category_name),brand(brand_name))'),
        db.from('return').select('return_id,return_date,quantity,reason,sale_item_id,sale_item(sale_id,unit_price,product(product_name,category(category_name)))'),
        db.from('product').select('product_id,product_name,quantity,reorder_level,price,category(category_name),brand(brand_name),unit(unit_type)'),
        db.from('employee').select('employee_id,full_name,role(role_name)'),
      ]);

      // ── Filter to selected month ──
      const curSales     = (allSales||[]).filter(s => (s.sale_date||'').startsWith(curM));
      const curSaleIds   = new Set(curSales.map(s => s.sale_id));
      const curSaleItems = (allSaleItems||[]).filter(si => curSaleIds.has(si.sale_id));

      const curReturnItems = (allReturns||[]).filter(r => {
        const sid = r.sale_item?.sale_id;
        return curSaleIds.has(sid);
      });

      const lowStockList = (allProducts||[])
        .filter(p => (p.quantity||0) <= (p.reorder_level||0))
        .sort((a,b) => (a.quantity||0) - (b.quantity||0));

      const prodData = {};
      curSaleItems.forEach(si => {
        const name  = si.product?.product_name || 'Unknown';
        const cat   = si.product?.category?.category_name || '—';
        const brd   = si.product?.brand?.brand_name || '—';
        const price = parseFloat(si.unit_price || 0);
        const qty   = si.quantity || 0;
        const rev   = price * qty;
        const cost  = rev * COGS_RATE;
        if (!prodData[name]) prodData[name] = { cat, brd, unitPrice:price, unitsSold:0, grossSales:0, cost:0, grossProfit:0 };
        prodData[name].unitsSold   += qty;
        prodData[name].grossSales  += rev;
        prodData[name].cost        += cost;
        prodData[name].grossProfit += rev - cost;
      });

      const catData = {};
      Object.values(prodData).forEach(d => {
        const c = d.cat;
        if (!catData[c]) catData[c] = { unitsSold:0, grossSales:0, cost:0, grossProfit:0, products:[] };
        catData[c].unitsSold   += d.unitsSold;
        catData[c].grossSales  += d.grossSales;
        catData[c].cost        += d.cost;
        catData[c].grossProfit += d.grossProfit;
      });
      Object.entries(prodData).forEach(([name, d]) => {
        if (catData[d.cat]) catData[d.cat].products.push({ name, ...d });
      });
      Object.values(catData).forEach(cd => cd.products.sort((a,b) => b.grossSales - a.grossSales));

      const catList = Object.entries(catData).sort((a,b) => b[1].grossSales - a[1].grossSales);
      const topCat  = catList.length ? catList[0][0] : '—';

      const grandSales  = curSaleItems.reduce((a,si) => a + (si.quantity||0)*parseFloat(si.unit_price||0), 0);
      const grandCost   = grandSales * COGS_RATE;
      const grandProfit = grandSales - grandCost;
      const grandUnits  = curSaleItems.reduce((a,si) => a + (si.quantity||0), 0);
      const grandOrders = curSales.length;

      const reasonMap = {};
      curReturnItems.forEach(r => {
        const reason = (r.reason||'Unspecified').trim();
        if (!reasonMap[reason]) reasonMap[reason] = { count:0, qty:0 };
        reasonMap[reason].count += 1;
        reasonMap[reason].qty   += r.quantity || 0;
      });
      const reasonList     = Object.entries(reasonMap).sort((a,b) => b[1].qty - a[1].qty);
      const totalReturnQty = curReturnItems.reduce((a,r) => a+(r.quantity||0), 0);

      const empSalesMap = {};
      curSales.forEach(s => {
        const n = s.employee?.full_name || 'Unknown';
        if (!empSalesMap[n]) empSalesMap[n] = { rev:0, orders:0 };
        empSalesMap[n].rev    += parseFloat(s.total_amount||0);
        empSalesMap[n].orders += 1;
      });
      const empList  = Object.entries(empSalesMap).sort((a,b) => b[1].rev - a[1].rev);
      const empRoles = {};
      (allEmployees||[]).forEach(e => { empRoles[e.full_name] = e.role?.role_name||'—'; });

      // ================================================================
      //  SHEETJS SETUP
      // ================================================================
      const wb = XLSX.utils.book_new();

      const fl  = hex => ({ patternType:'solid', fgColor:{rgb:hex} });
      const F = {
        DK   : fl('1B5E20'), MED  : fl('2E7D32'), COL  : fl('388E3C'),
        LT   : fl('E8F5E9'), MINT : fl('F9FBE7'), WHITE: fl('FFFFFF'),
        GRAY : fl('F5F5F5'), DGRAY: fl('EEEEEE'),
        RED  : fl('FFEBEE'), AMB  : fl('FFF8E1'), LBLU : fl('E3F2FD'),
        CATBG: fl('EDF7ED'),
      };

      const tb = c => ({ style:'thin', color:{rgb:c||'C8E6C9'} });
      const B = {
        G : { top:tb(),          bottom:tb(),          left:tb(),          right:tb()          },
        D : { top:tb('388E3C'), bottom:tb('388E3C'), left:tb('388E3C'), right:tb('388E3C') },
        N : {},
      };

      const fn = (sz, bold, col, italic) => ({ name:'Arial', sz, bold:!!bold, color:{rgb:col||'222222'}, italic:!!italic });
      const FN = {
        title : fn(14, true,  'FFFFFF'),
        sub   : fn(8,  false, 'A5D6A7', true),
        sec   : fn(10, true,  'FFFFFF'),
        col   : fn(9,  true,  'FFFFFF'),
        lbl   : fn(9,  false, '333333'),
        lblB  : fn(9,  true,  '111111'),
        numB  : fn(9,  true,  '1B5E20'),
        grn   : fn(9,  true,  '1B5E20'),
        red   : fn(9,  true,  'B71C1C'),
        amb   : fn(9,  true,  'E65100'),
        muted : fn(8,  false, '999999', true),
        catLbl: fn(9,  true,  '1B5E20'),
        rank  : fn(11, true,  '1B5E20'),
      };

      const PHP = '\u20b1#,##0.00';
      const NUM = '#,##0';
      const PCT = '0.0%';

      function enc(r,c)     { return XLSX.utils.encode_cell({r,c}); }
      function xr(ws,r,c)   {
        const ref = XLSX.utils.decode_range(ws['!ref']||'A1:A1');
        if(r>ref.e.r)ref.e.r=r; if(c>ref.e.c)ref.e.c=c;
        ws['!ref']=XLSX.utils.encode_range(ref);
      }
      function wc(ws,r,c,v,s) { ws[enc(r,c)]={v:v??'',t:typeof v==='number'?'n':'s',s}; xr(ws,r,c); }
      function mg(ws,r1,c1,r2,c2) { if(!ws['!merges'])ws['!merges']=[]; ws['!merges'].push({s:{r:r1,c:c1},e:{r:r2,c:c2}}); }
      function st(fill,font,halign,numFmt,border) {
        const s={fill:fill||F.WHITE,font:font||FN.lbl,alignment:{horizontal:halign||'left',vertical:'center',wrapText:false},border:border||B.G};
        if(numFmt)s.numFmt=numFmt;
        return s;
      }
      function rh(n) { return Array.from({length:n},(_,i)=>({hpt:i===0?22:i===1?13:17})); }

      function titleBar(ws,text,cols) {
        wc(ws,0,0,text, st(F.DK,FN.title,'left',null,B.N)); mg(ws,0,0,0,cols-1);
        wc(ws,1,0,`${monthLabel}   |   Generated: ${now.toLocaleString('en-PH')}   |   Joe Hardware & Motorparts`,
          st(F.DK,FN.sub,'left',null,B.N)); mg(ws,1,0,1,cols-1);
      }
      function secHdr(ws,r,text,c1,c2) {
        wc(ws,r,c1,text,st(F.MED,FN.sec,'left',null,B.D));
        if(c2>c1) mg(ws,r,c1,r,c2);
      }
      function colHdrs(ws,r,hdrs,startC,aligns) {
        hdrs.forEach((h,i)=>wc(ws,r,startC+i,h,st(F.COL,FN.col,(aligns&&aligns[i])||'left',null,B.D)));
      }
      function totalRow(ws,r,cols,cells) {
        for(let c=0;c<cols;c++) wc(ws,r,c,'',st(F.LT,FN.grn,'left',null,B.D));
        cells.forEach(({c,v,fmt})=>{
          wc(ws,r,c,v??'',st(F.LT,FN.grn,typeof v==='number'?'right':'left',fmt,B.D));
        });
      }
      function emptyNote(ws,r,text,cols) {
        wc(ws,r,0,text,st(F.WHITE,FN.muted,'left',null,B.N)); mg(ws,r,0,r,cols-1);
      }

      function buildMonthlySummary() {
        const ws={}; ws['!merges']=[];
        ws['!cols']=[{wch:28},{wch:18},{wch:1.5},{wch:28},{wch:18}];
        titleBar(ws,'MONTHLY SALES REPORT',5);
        secHdr(ws,3,'SALES METRICS',0,1);
        wc(ws,3,2,'',st(F.WHITE,FN.lbl,'left',null,B.N));
        secHdr(ws,3,'PERFORMANCE SUMMARY',3,4);
        const METRICS = [
          { lbl:'Total Monthly Sales',   val:grandSales,  fmt:PHP },
          { lbl:'Total Cost (est. 60%)', val:grandCost,   fmt:PHP },
          { lbl:'Gross Profit',          val:grandProfit, fmt:PHP },
          { lbl:'Gross Margin %',        val:grandSales>0?Math.round((grandProfit/grandSales)*1000)/1000:0, fmt:PCT },
          { lbl:'Total Units Sold',      val:grandUnits,  fmt:NUM },
          { lbl:'Total Orders',          val:grandOrders, fmt:NUM },
          { lbl:'Avg Order Value',       val:grandOrders?grandSales/grandOrders:0, fmt:PHP },
        ];
        METRICS.forEach((m,i)=>{
          const r=4+i, rf=i%2===0?F.WHITE:F.MINT;
          wc(ws,r,0,m.lbl, st(rf,FN.lbl,'left',null,B.G));
          wc(ws,r,1,m.val, st(rf,FN.numB,'right',m.fmt,B.G));
          wc(ws,r,2,'',    st(F.WHITE,FN.lbl,'left',null,B.N));
        });
        const PERF = [
          { lbl:'Top Selling Category', val:topCat },
          { lbl:'Total Products Sold',  val:`${Object.keys(prodData).length} product(s)` },
          { lbl:'Total Returns',        val:`${curReturnItems.length} return(s), ${totalReturnQty} unit(s)` },
          { lbl:'Low / Out of Stock',   val:lowStockList.length>0?`${lowStockList.length} item(s) need attention`:'All stocks OK' },
          { lbl:'Top Employee',         val:empList.length?empList[0][0]:'—' },
          { lbl:'Top Employee Revenue', val:empList.length?empList[0][1].rev:0, fmt:PHP },
          { lbl:'Report Period',        val:monthLabel },
        ];
        PERF.forEach((p,i)=>{
          const r=4+i, rf=i%2===0?F.WHITE:F.MINT;
          const isLow=p.lbl==='Low / Out of Stock'&&lowStockList.length>0;
          wc(ws,r,3,p.lbl, st(rf,FN.lblB,'left',null,B.G));
          if(typeof p.val==='number') wc(ws,r,4,p.val, st(rf,FN.numB,'right',p.fmt,B.G));
          else wc(ws,r,4,p.val, st(rf,isLow?FN.amb:FN.lbl,'left',null,B.G));
        });
        ws['!rows']=rh(4+Math.max(METRICS.length,PERF.length)+1);
        return ws;
      }

      function buildProductSales() {
        const ws={}; ws['!merges']=[];
        ws['!cols']=[{wch:5},{wch:30},{wch:16},{wch:12},{wch:14},{wch:14},{wch:14},{wch:12}];
        const COLS=8;
        titleBar(ws,'PRODUCT SALES — '+monthLabel.toUpperCase(),COLS);
        secHdr(ws,3,'ALL PRODUCTS SOLD THIS MONTH (grouped by category)',0,COLS-1);
        colHdrs(ws,4,['#','Product Name','Category','Units Sold','Unit Price','Gross Sales','Cost (60%)','Gross Profit'],0,
          ['center','left','left','right','right','right','right','right']);
        let row=5, rank=0;
        catList.forEach(([catName, cd])=>{
          cd.products.forEach(p=>{
            rank++;
            const rf=rank%2===0?F.MINT:F.WHITE;
            wc(ws,row,0,rank,                    st(rf,FN.lbl,'center',null,B.G));
            wc(ws,row,1,p.name,                  st(rf,FN.lblB,'left',null,B.G));
            wc(ws,row,2,p.cat,                   st(rf,FN.lbl,'left',null,B.G));
            wc(ws,row,3,p.unitsSold,             st(rf,FN.lbl,'right',NUM,B.G));
            wc(ws,row,4,parseFloat(p.unitPrice), st(rf,FN.lbl,'right',PHP,B.G));
            wc(ws,row,5,parseFloat(p.grossSales),st(rf,FN.numB,'right',PHP,B.G));
            wc(ws,row,6,parseFloat(p.cost),      st(rf,FN.lbl,'right',PHP,B.G));
            wc(ws,row,7,parseFloat(p.grossProfit),st(rf,FN.numB,'right',PHP,B.G));
            row++;
          });
          wc(ws,row,0,'',                        st(F.CATBG,FN.catLbl,'left',null,B.D));
          wc(ws,row,1,`  ${catName} — Subtotal`, st(F.CATBG,FN.catLbl,'left',null,B.D));
          wc(ws,row,2,'',                        st(F.CATBG,FN.catLbl,'left',null,B.D));
          wc(ws,row,3,cd.unitsSold,              st(F.CATBG,FN.catLbl,'right',NUM,B.D));
          wc(ws,row,4,'',                        st(F.CATBG,FN.catLbl,'left',null,B.D));
          wc(ws,row,5,parseFloat(cd.grossSales), st(F.CATBG,FN.catLbl,'right',PHP,B.D));
          wc(ws,row,6,parseFloat(cd.cost),       st(F.CATBG,FN.catLbl,'right',PHP,B.D));
          wc(ws,row,7,parseFloat(cd.grossProfit),st(F.CATBG,FN.catLbl,'right',PHP,B.D));
          row++;
        });
        totalRow(ws,row,COLS,[
          {c:1,v:'GRAND TOTAL'},
          {c:3,v:grandUnits,fmt:NUM},
          {c:5,v:parseFloat(grandSales),fmt:PHP},
          {c:6,v:parseFloat(grandCost),fmt:PHP},
          {c:7,v:parseFloat(grandProfit),fmt:PHP},
        ]);
        row++;
        if(!catList.length) emptyNote(ws,5,'No sales recorded this month.',COLS);
        wc(ws,row+1,0,'* Cost is estimated at 60% of unit price. Gross Profit = Gross Sales − Cost.',
          st(F.WHITE,FN.muted,'left',null,B.N)); mg(ws,row+1,0,row+1,COLS-1);
        ws['!rows']=rh(row+3);
        return ws;
      }

      function buildLowStock() {
        const ws={}; ws['!merges']=[];
        ws['!cols']=[{wch:5},{wch:30},{wch:18},{wch:14},{wch:14},{wch:14}];
        const COLS=6;
        titleBar(ws,'LOW & OUT OF STOCK ITEMS',COLS);
        secHdr(ws,3,`ITEMS AT OR BELOW REORDER LEVEL  (${lowStockList.length} item${lowStockList.length!==1?'s':''})`,0,COLS-1);
        colHdrs(ws,4,['#','Product Name','Category','Qty in Stock','Reorder Level','Status'],0,
          ['center','left','left','right','right','center']);
        lowStockList.forEach((p,i)=>{
          const r=5+i, isOut=(p.quantity||0)<=0;
          const rf=isOut?F.RED:F.AMB, f=isOut?FN.red:FN.amb;
          wc(ws,r,0,i+1,                            st(rf,f,'center',null,B.G));
          wc(ws,r,1,p.product_name,                 st(rf,{...f,bold:true},'left',null,B.G));
          wc(ws,r,2,p.category?.category_name||'—', st(rf,f,'left',null,B.G));
          wc(ws,r,3,p.quantity||0,                  st(rf,{...f,bold:true},'right',NUM,B.G));
          wc(ws,r,4,p.reorder_level||0,             st(rf,f,'right',NUM,B.G));
          wc(ws,r,5,isOut?'OUT OF STOCK':'LOW STOCK',st(rf,f,'center',null,B.G));
        });
        if(!lowStockList.length){
          wc(ws,5,0,'✓ All products are above their reorder levels.',st(F.LT,FN.grn,'left',null,B.N));
          mg(ws,5,0,5,COLS-1);
        }
        const noteR=5+lowStockList.length+1;
        wc(ws,noteR,0,'Red = Out of stock (qty = 0).  Amber = Low stock (qty ≤ reorder level).',
          st(F.WHITE,FN.muted,'left',null,B.N)); mg(ws,noteR,0,noteR,COLS-1);
        ws['!rows']=rh(noteR+1);
        return ws;
      }

      function buildReturns() {
        const ws={}; ws['!merges']=[];
        ws['!cols']=[{wch:10},{wch:14},{wch:28},{wch:18},{wch:12},{wch:14},{wch:34}];
        const COLS=7;
        titleBar(ws,'RETURNS — '+monthLabel.toUpperCase(),COLS);
        secHdr(ws,3,'RETURN REASON SUMMARY',0,COLS-1);
        colHdrs(ws,4,['Reason','# Incidents','Total Units Returned','% of Returns'],0,
          ['left','center','right','right']);
        reasonList.forEach(([reason,d],i)=>{
          const r=5+i, rf=i%2===0?F.WHITE:F.MINT;
          const share=totalReturnQty>0?d.qty/totalReturnQty:0;
          wc(ws,r,0,reason,  st(rf,FN.lblB,'left',null,B.G));
          wc(ws,r,1,d.count, st(rf,FN.lbl,'center',NUM,B.G));
          wc(ws,r,2,d.qty,   st(rf,FN.lbl,'right',NUM,B.G));
          wc(ws,r,3,parseFloat(Math.round(share*1000)/1000),st(rf,FN.lbl,'right',PCT,B.G));
          for(let c=4;c<COLS;c++) wc(ws,r,c,'',st(rf,FN.lbl,'left',null,B.G));
        });
        if(!reasonList.length){
          wc(ws,5,0,'No returns recorded this month.',st(F.LT,FN.grn,'left',null,B.N));
          mg(ws,5,0,5,COLS-1);
        }
        const totR=5+reasonList.length;
        totalRow(ws,totR,COLS,[
          {c:0,v:'TOTAL'},
          {c:1,v:curReturnItems.length,fmt:NUM},
          {c:2,v:totalReturnQty,fmt:NUM},
          {c:3,v:1,fmt:PCT},
        ]);
        const detailR=totR+2;
        secHdr(ws,detailR,'RETURN DETAILS',0,COLS-1);
        colHdrs(ws,detailR+1,['Return ID','Return Date','Product','Category','Qty','Unit Price','Reason'],0,
          ['center','left','left','left','right','right','left']);
        curReturnItems.forEach((r,i)=>{
          const row=detailR+2+i, rf=i%2===0?F.WHITE:F.RED;
          wc(ws,row,0,r.return_id,                                          st(rf,FN.lbl,'center',null,B.G));
          wc(ws,row,1,r.return_date||'—',                                   st(rf,FN.lbl,'left',null,B.G));
          wc(ws,row,2,r.sale_item?.product?.product_name||'—',              st(rf,FN.lblB,'left',null,B.G));
          wc(ws,row,3,r.sale_item?.product?.category?.category_name||'—',   st(rf,FN.lbl,'left',null,B.G));
          wc(ws,row,4,r.quantity||0,                                        st(rf,FN.lbl,'right',NUM,B.G));
          wc(ws,row,5,parseFloat(r.sale_item?.unit_price||0),               st(rf,FN.lbl,'right',PHP,B.G));
          wc(ws,row,6,r.reason||'—',                                        st(rf,FN.lbl,'left',null,B.G));
        });
        ws['!rows']=rh(detailR+2+curReturnItems.length+1);
        return ws;
      }

      XLSX.utils.book_append_sheet(wb, buildMonthlySummary(), '📊 Monthly Sales Report');
      XLSX.utils.book_append_sheet(wb, buildProductSales(),   '🧾 Product Sales');
      XLSX.utils.book_append_sheet(wb, buildLowStock(),       '⚠ Low & Out of Stock');
      XLSX.utils.book_append_sheet(wb, buildReturns(),        '🔄 Returns');

      XLSX.writeFile(wb, `JoexHardware_${curM}.xlsx`, { bookType:'xlsx', type:'binary', cellStyles:true });
      showToast('✅ Excel report downloaded!', 'success');

    } catch (err) {
      console.error(err);
      showToast('❌ Export failed: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><polyline points="9 14 12 17 15 14"/></svg> Download Excel Report`;
    }
  });

})();