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
  function peso(n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 }); }
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
  style.textContent = `.report-tab{padding:7px 16px;border-radius:20px;border:none;font-family:'Barlow',sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;cursor:pointer;background:transparent;color:var(--text-muted);transition:all 0.15s;}.report-tab:hover{color:var(--text-sub);}.report-tab.active{background:var(--amber);color:#000;}`;
  document.head.appendChild(style);

  window._switchReport = function(tab) {
    activeTab=tab;
    ['sales','inventory','supply','employee'].forEach(t=>{document.getElementById(`panel-${t}`).style.display=t===tab?'block':'none';document.getElementById(`rtab-${t}`).classList.toggle('active',t===tab);});
    loadTab(tab);
  };

  async function loadTab(tab) {
    if(tab==='sales')     await loadSalesReport();
    if(tab==='inventory') await loadInventoryReport();
    if(tab==='supply')    await loadSupplyReport();
    if(tab==='employee')  await loadEmployeeReport();
  }

  async function loadSalesReport() {
    const panel=document.getElementById('panel-sales');
    panel.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="card"><div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;margin-bottom:16px;">Top Selling Products</div><div style="height:300px;"><canvas id="chart-top-products"></canvas></div></div>
      <div class="card"><div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;margin-bottom:16px;">Sales by Category</div><div style="height:300px;display:flex;align-items:center;justify-content:center;"><canvas id="chart-sales-cat"></canvas></div></div>
    </div>`;
    const {data:saleItems}=await db.from('sale_item').select('quantity,product(product_name)');
    const productTotals={};(saleItems||[]).forEach(si=>{const name=si.product?.product_name||'Unknown';productTotals[name]=(productTotals[name]||0)+si.quantity;});
    const sorted=Object.entries(productTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const {data:products}=await db.from('product').select('product_id,product_name,category(category_name)');
    const {data:saleItems2}=await db.from('sale_item').select('quantity,unit_price,product_id');
    const catTotals={};(saleItems2||[]).forEach(si=>{const p=(products||[]).find(x=>x.product_id===si.product_id);const cat=p?.category?.category_name||'Other';catTotals[cat]=(catTotals[cat]||0)+(si.quantity*si.unit_price);});
    const catEntries=Object.entries(catTotals);
    const PIE_COLORS=['#f5a623','#4caf50','#2196f3','#e53935','#9c27b0','#00bcd4'];
    destroyChart('top-products');destroyChart('sales-cat');
    const ctx1=document.getElementById('chart-top-products')?.getContext('2d');
    if(ctx1&&sorted.length)charts['top-products']=new Chart(ctx1,{type:'bar',data:{labels:sorted.map(([n])=>n),datasets:[{data:sorted.map(([,v])=>v),backgroundColor:'#f5a623',borderRadius:4,borderSkipped:false}]},options:{...CHART_DEFAULTS}});
    else if(ctx1)ctx1.canvas.parentElement.innerHTML=`<div class="empty-state">No sales data yet.</div>`;
    const ctx2=document.getElementById('chart-sales-cat')?.getContext('2d');
    if(ctx2&&catEntries.length)charts['sales-cat']=new Chart(ctx2,{type:'pie',data:{labels:catEntries.map(([n])=>n),datasets:[{data:catEntries.map(([,v])=>v),backgroundColor:PIE_COLORS,borderWidth:0}]},options:{maintainAspectRatio:false,responsive:true,plugins:{legend:{display:true,position:'right',labels:{color:'#888',font:{family:"'Barlow',sans-serif",size:11},boxWidth:12}}}}});
    else if(ctx2)ctx2.canvas.parentElement.innerHTML=`<div class="empty-state">No category data yet.</div>`;
  }

  async function loadInventoryReport() {
    const panel=document.getElementById('panel-inventory');
    panel.innerHTML=`<div class="card" style="padding:0;overflow:hidden;"><div style="padding:20px 22px 0;"><div style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;margin-bottom:16px;">Low Stock Products</div></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Reorder Level</th><th>Status</th></tr></thead><tbody id="inv-tbody"><tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody></table></div></div>`;
    const {data:all}=await db.from('product').select('product_name,quantity,reorder_level,category(category_name)').order('quantity');
    const low=(all||[]).filter(p=>p.quantity<=p.reorder_level);
    const tbody=document.getElementById('inv-tbody');
    if(!low.length){tbody.innerHTML=`<tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">&#10003; All products are well stocked.</td></tr>`;return;}
    tbody.innerHTML=low.map(p=>{
      const isOut=p.quantity<=0;
      const badge=isOut?`<span style="background:#3a0a0a;color:#e53935;border:1px solid rgba(229,57,53,0.3);border-radius:4px;padding:3px 8px;font-size:10px;font-weight:800;text-transform:uppercase;">OUT</span>`:`<span style="background:#3a2a0a;color:#f5a623;border:1px solid rgba(245,166,35,0.3);border-radius:4px;padding:3px 8px;font-size:10px;font-weight:800;text-transform:uppercase;">LOW</span>`;
      return `<tr><td style="font-weight:600;color:#fff;">${p.product_name}</td><td style="color:var(--text-muted);">${p.category?.category_name||'—'}</td><td style="color:var(--amber);font-weight:700;">${p.quantity}</td><td style="color:var(--text-sub);">${p.reorder_level}</td><td>${badge}</td></tr>`;
    }).join('');
  }

  async function loadSupplyReport() {
    const panel=document.getElementById('panel-supply');
    panel.innerHTML=`<div class="card"><div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;margin-bottom:16px;">Spending by Supplier</div><div style="height:320px;"><canvas id="chart-supply-spend"></canvas></div></div>`;
    const {data:supplies}=await db.from('supply').select('total_amount,supplier(supplier_name)');
    const spendMap={};(supplies||[]).forEach(s=>{const name=s.supplier?.supplier_name||'Unknown';spendMap[name]=(spendMap[name]||0)+parseFloat(s.total_amount||0);});
    const entries=Object.entries(spendMap).sort((a,b)=>b[1]-a[1]);
    destroyChart('supply-spend');
    const ctx=document.getElementById('chart-supply-spend')?.getContext('2d');
    if(!ctx)return;
    if(!entries.length){ctx.canvas.parentElement.innerHTML=`<div class="empty-state">No supply data yet.</div>`;return;}
    charts['supply-spend']=new Chart(ctx,{type:'bar',data:{labels:entries.map(([n])=>n),datasets:[{data:entries.map(([,v])=>v),backgroundColor:'#4caf50',borderRadius:4,borderSkipped:false}]},options:{...CHART_DEFAULTS,indexAxis:'y',scales:{x:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#888',font:{family:"'Barlow',sans-serif",size:11}}},y:{grid:{display:false},ticks:{color:'#888',font:{family:"'Barlow',sans-serif",size:11}}}}}});
  }

  async function loadEmployeeReport() {
    const panel=document.getElementById('panel-employee');
    panel.innerHTML=`<div class="card"><div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;margin-bottom:16px;">Sales by Employee</div><div style="height:320px;"><canvas id="chart-emp-sales"></canvas></div></div>`;
    const {data:sales}=await db.from('sale').select('total_amount,employee(full_name)');
    const empMap={};(sales||[]).forEach(s=>{const name=s.employee?.full_name||'Unknown';empMap[name]=(empMap[name]||0)+parseFloat(s.total_amount||0);});
    const entries=Object.entries(empMap).sort((a,b)=>b[1]-a[1]);
    destroyChart('emp-sales');
    const ctx=document.getElementById('chart-emp-sales')?.getContext('2d');
    if(!ctx)return;
    if(!entries.length){ctx.canvas.parentElement.innerHTML=`<div class="empty-state">No employee sales data yet.</div>`;return;}
    charts['emp-sales']=new Chart(ctx,{type:'bar',data:{labels:entries.map(([n])=>n),datasets:[{data:entries.map(([,v])=>v),backgroundColor:'#f5a623',borderRadius:4,borderSkipped:false}]},options:{...CHART_DEFAULTS}});
  }

  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
  script.onload=()=>loadTab('sales');
  document.head.appendChild(script);

})();