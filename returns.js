// ================================================================
//  returns.js — Joe Hardware & Motorparts
// ================================================================

(async function () {

  renderShell('returns');
  document.getElementById('header-title').textContent = 'Returns';

  const pc = document.getElementById('pageContent');
  let RETURNS = [], filtered = [];
  const REASONS = ['Defective', 'Wrong Item', 'Customer Request', 'Quality Issue', 'Damaged', 'Other'];

  function showToast(msg, type = 'success') {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { const m = document.getElementById('modalSlot'); if (m) m.innerHTML = ''; }
  function peso(n) { return '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 }); }
  function formatTime(d) { const dt = new Date(d); return isNaN(dt) ? '—' : dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }); }

  pc.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Returns</h1>
        <div class="page-sub">Manage product returns linked to sales records</div>
      </div>
      <button class="btn btn-amber" id="btn-add">+ New Return</button>
    </div>
    <div class="toolbar" style="margin-bottom:16px;">
      <input class="search-input" id="search-returns" type="text" placeholder="Search product, sale ID, or reason..."/>
      <span id="returns-count" style="margin-left:auto;font-size:13px;color:var(--text-muted);font-weight:600;"></span>
    </div>
    <div class="card" style="padding:0;overflow:hidden;">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Return ID</th><th>Date</th><th>Time</th><th>Sale ID</th><th>Product</th><th>Qty</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody id="returns-tbody"><tr><td colspan="8" class="td-muted" style="text-align:center;padding:40px;">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>
    <div id="modalSlot"></div>
    <div id="toast" class="toast"></div>`;

  function statusBadge() { return `<span style="background:#0d2e14;color:#4caf50;border:1px solid rgba(76,175,80,0.35);border-radius:4px;padding:3px 10px;font-size:10px;font-weight:800;text-transform:uppercase;">PROCESSED</span>`; }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="8" class="td-muted" style="text-align:center;padding:40px;">No returns found.</td></tr>`;
    return list.map(r => `<tr>
      <td style="color:var(--amber);font-weight:700;">#${r.return_id}</td>
      <td style="color:var(--text-sub);">${r.return_date}</td>
      <td style="color:var(--text-muted);">${formatTime(r.return_date)}</td>
      <td style="color:var(--amber);font-weight:600;">#${r.sale_item?.sale_id||'—'}</td>
      <td style="font-weight:600;color:#fff;">${r.sale_item?.product?.product_name||'—'}</td>
      <td>${r.quantity}</td>
      <td style="color:var(--text-sub);">${r.reason||'—'}</td>
      <td>${statusBadge()}</td>
    </tr>`).join('');
  }

  function renderTable() {
    document.getElementById('returns-tbody').innerHTML = tableRows(filtered);
    document.getElementById('returns-count').textContent = `${filtered.length} return${filtered.length!==1?'s':''}`;
  }

  async function loadReturns() {
    const {data} = await db.from('return').select('*, sale_item(sale_item_id, sale_id, product(product_name))').order('return_date',{ascending:false});
    RETURNS = data||[]; filtered = [...RETURNS]; renderTable();
  }

  function applyFilters() {
    const q = (document.getElementById('search-returns')?.value||'').toLowerCase();
    filtered = RETURNS.filter(r => !q||(r.sale_item?.product?.product_name||'').toLowerCase().includes(q)||(r.reason||'').toLowerCase().includes(q)||String(r.sale_item?.sale_id||'').includes(q)||r.return_date.includes(q));
    renderTable();
  }

  function openModal(prefillSaleId='') {
    let searchMode = 'sale_id';
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box" style="max-width:520px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;">
            <div class="modal-title">Process Return</div>
            <button class="modal-close" id="mc">&#10005;</button>
          </div>
          <div id="step1">
            <div style="background:#161616;border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:16px;">
              <div style="font-size:11px;font-weight:800;color:var(--amber);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Step 1: Find Sale Record</div>
              <div style="display:flex;gap:4px;margin-bottom:14px;">
                <button id="mode-saleid" style="padding:6px 14px;border-radius:5px;border:none;font-family:'Barlow',sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;cursor:pointer;background:var(--amber);color:#000;">Sale ID</button>
                <button id="mode-customer" onclick="window._setSearchMode('customer')" style="padding:6px 14px;border-radius:5px;border:none;font-family:'Barlow',sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;cursor:pointer;background:transparent;color:var(--text-muted);">Customer Name</button>
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <input class="form-input" id="f-search" type="text" placeholder="${prefillSaleId?'#'+prefillSaleId:'Enter Sale ID...'}" value="${prefillSaleId||''}" style="flex:1;"/>
                <button class="btn btn-amber" id="btn-search" type="button" style="padding:10px 18px;white-space:nowrap;">Search</button>
              </div>
            </div>
            <div id="search-results"></div>
          </div>
          <div id="step2" style="display:none;">
            <div id="sale-info" style="background:#161616;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:14px;"></div>
            <div style="font-size:11px;font-weight:800;color:var(--amber);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Select Items to Return</div>
            <div id="return-items"></div>
            <div class="form-group" style="margin-top:14px;"><label class="form-label">Reason</label><select class="form-input" id="f-reason">${REASONS.map(r=>`<option value="${r}">${r}</option>`).join('')}</select></div>
            <div class="form-group"><label class="form-label">Return Date</label><input class="form-input" id="f-date" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;padding-top:16px;border-top:1px solid var(--border);">
              <button class="btn-ghost" id="btn-back">&#8592; Back</button>
              <button class="btn btn-amber" id="btn-confirm">&#10003; Confirm Return</button>
            </div>
          </div>
        </div>
      </div>`;

    document.getElementById('mc').addEventListener('click',closeModal);
    document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
    document.getElementById('mode-saleid').addEventListener('click',()=>window._setSearchMode('sale_id'));

    let saleItems = [];

    window._setSearchMode = function(mode) {
      searchMode=mode;
      document.getElementById('mode-saleid').style.background=mode==='sale_id'?'var(--amber)':'transparent';
      document.getElementById('mode-saleid').style.color=mode==='sale_id'?'#000':'var(--text-muted)';
      document.getElementById('mode-customer').style.background=mode==='customer'?'var(--amber)':'transparent';
      document.getElementById('mode-customer').style.color=mode==='customer'?'#000':'var(--text-muted)';
      document.getElementById('f-search').value='';
      document.getElementById('f-search').placeholder=mode==='sale_id'?'Enter Sale ID...':'Enter Customer Name...';
      document.getElementById('search-results').innerHTML='';
    };

    document.getElementById('btn-search').addEventListener('click',async()=>{
      const q=document.getElementById('f-search').value.trim();
      if(!q){showToast('Enter a value to search.','error');return;}
      const resultsEl=document.getElementById('search-results');
      resultsEl.innerHTML=`<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">Searching...</div>`;
      let query=db.from('sale').select('sale_id,sale_date,total_amount,customer(full_name),sale_item(sale_item_id,quantity,unit_price,product(product_name))');
      if(searchMode==='sale_id'&&!isNaN(q)){query=query.eq('sale_id',parseInt(q));}
      else{const {data:custs}=await db.from('customer').select('customer_id').ilike('full_name',`%${q}%`);const ids=(custs||[]).map(c=>c.customer_id);if(!ids.length){resultsEl.innerHTML=`<div class="empty-state">No sales found.</div>`;return;}query=query.in('customer_id',ids);}
      const {data:sales}=await query.order('sale_date',{ascending:false}).limit(8);
      if(!sales||!sales.length){resultsEl.innerHTML=`<div class="empty-state">No matching sales found.</div>`;return;}
      resultsEl.innerHTML=sales.map(s=>`
        <div class="sale-result-item" data-id="${s.sale_id}" style="background:#161616;border:1px solid var(--border);border-radius:8px;padding:11px 14px;margin-bottom:6px;cursor:pointer;transition:border-color 0.15s;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div><span style="color:var(--amber);font-weight:700;">Sale #${s.sale_id}</span><span style="font-size:12px;color:var(--text-muted);margin-left:10px;">${s.sale_date} &middot; ${s.customer?.full_name||'Walk-in'}</span></div>
            <span style="color:#4caf50;font-weight:700;font-size:13px;">${peso(s.total_amount)}</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">${(s.sale_item||[]).length} item(s)</div>
        </div>`).join('');
      resultsEl.querySelectorAll('.sale-result-item').forEach(el=>{
        el.addEventListener('mouseenter',()=>el.style.borderColor='var(--amber)');
        el.addEventListener('mouseleave',()=>el.style.borderColor='var(--border)');
        el.addEventListener('click',()=>{const sale=sales.find(s=>s.sale_id===parseInt(el.dataset.id));loadStep2(sale);});
      });
    });

    if(prefillSaleId)setTimeout(()=>document.getElementById('btn-search').click(),150);

    function loadStep2(sale){
      saleItems=(sale.sale_item||[]).map(si=>({sale_item_id:si.sale_item_id,product_name:si.product?.product_name||'?',max_qty:si.quantity,checked:false}));
      document.getElementById('step1').style.display='none';
      document.getElementById('step2').style.display='block';
      document.getElementById('sale-info').innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-weight:700;color:#fff;">Sale #${sale.sale_id}</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${sale.sale_date} &middot; ${sale.customer?.full_name||'Walk-in'}</div></div>
          <div style="color:#4caf50;font-weight:700;">${peso(sale.total_amount)}</div>
        </div>`;
      document.getElementById('return-items').innerHTML=saleItems.map((si,idx)=>`
        <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:#161616;border:1px solid var(--border);border-radius:7px;margin-bottom:6px;">
          <input type="checkbox" id="chk-${idx}" style="accent-color:var(--amber);width:16px;height:16px;flex-shrink:0;" onchange="window._toggleReturnItem(${idx},this.checked)"/>
          <span style="flex:1;font-size:13px;color:#fff;font-weight:600;">${si.product_name}</span>
          <span style="font-size:11px;color:var(--text-muted);">Max ${si.max_qty}</span>
          <input type="number" min="1" max="${si.max_qty}" value="1" id="rqty-${idx}" style="width:56px;background:#252525;border:1px solid var(--input-border);color:#fff;padding:5px 7px;border-radius:5px;text-align:center;font-size:12px;font-family:'Barlow',sans-serif;" disabled/>
        </div>`).join('');
    }

    window._toggleReturnItem=function(idx,checked){saleItems[idx].checked=checked;document.getElementById(`rqty-${idx}`).disabled=!checked;};

    document.getElementById('btn-back').addEventListener('click',()=>{document.getElementById('step2').style.display='none';document.getElementById('step1').style.display='block';});

    document.getElementById('btn-confirm').addEventListener('click',async()=>{
      const reason=document.getElementById('f-reason').value;
      const returnDate=document.getElementById('f-date').value;
      const toReturn=saleItems.map((si,idx)=>{const cb=document.getElementById(`chk-${idx}`);const qty=parseInt(document.getElementById(`rqty-${idx}`).value);if(!cb?.checked)return null;return{sale_item_id:si.sale_item_id,quantity:isNaN(qty)||qty<1?1:Math.min(qty,si.max_qty)};}).filter(Boolean);
      if(!toReturn.length){showToast('Select at least one item.','error');return;}
      for(const item of toReturn){const {error}=await db.from('return').insert({return_date:returnDate,sale_item_id:item.sale_item_id,quantity:item.quantity,reason});if(error){showToast('Error logging return.','error');return;}}
      closeModal();await loadReturns();showToast(`${toReturn.length} item(s) returned!`);
    });
  }

  await loadReturns();

  const urlParams = new URLSearchParams(window.location.search);
  const saleIdParam = urlParams.get('sale_id');
  if (saleIdParam) openModal(saleIdParam);

  document.getElementById('btn-add').addEventListener('click',()=>openModal());
  document.getElementById('search-returns').addEventListener('input',applyFilters);

})();