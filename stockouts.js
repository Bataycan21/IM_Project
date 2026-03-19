// ================================================================
//  stockouts.js — Joe Hardware & Motorparts
// ================================================================

(async function () {

  renderShell('stockouts');
  document.getElementById('header-title').textContent = 'Stock Out';

  const pc = document.getElementById('pageContent');
  let STOCKOUTS = [], PRODUCTS = [], EMPLOYEES = [], filtered = [];

  function showToast(msg, type = 'success') {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { const m = document.getElementById('modalSlot'); if (m) m.innerHTML = ''; }
  function peso(n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 }); }
  function formatTime(d) { const dt = new Date(d); return isNaN(dt) ? '—' : dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }); }

  pc.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Stock Out</h1>
        <div class="page-sub">Record non-sale stock removals (damage, loss, internal use)</div>
      </div>
      <button class="btn btn-amber" id="btn-add">+ New Stock Out</button>
    </div>
    <div class="toolbar" style="margin-bottom:16px;">
      <input class="search-input" id="search-stockouts" type="text" placeholder="Search product or description..."/>
      <select class="filter-select" id="filter-employee"><option value="">All Employees</option></select>
      <span id="stockouts-count" style="margin-left:auto;font-size:13px;color:var(--text-muted);font-weight:600;"></span>
    </div>
    <div class="card" style="padding:0;overflow:hidden;">
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Description</th><th>Handled By</th></tr></thead>
          <tbody id="stockouts-tbody"><tr><td colspan="8" class="td-muted" style="text-align:center;padding:40px;">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>
    <div id="modalSlot"></div>
    <div id="toast" class="toast"></div>`;

  function tableRows(list) {
    if(!list.length) return `<tr><td colspan="8" class="td-muted" style="text-align:center;padding:40px;">No stock-outs found.</td></tr>`;
    return list.map(s=>`<tr>
      <td style="color:var(--amber);font-weight:700;">#${s.stockout_id}</td>
      <td style="color:var(--text-sub);">${s.stockout_date}</td>
      <td style="color:var(--text-muted);">${formatTime(s.stockout_date)}</td>
      <td style="font-weight:600;color:#fff;">${s.product?.product_name||'—'}</td>
      <td style="color:#e53935;font-weight:700;">-${s.quantity}</td>
      <td style="color:var(--text-sub);">${s.unit_price?peso(s.unit_price):'—'}</td>
      <td style="color:var(--text-muted);">${s.stockout_description||'—'}</td>
      <td style="color:var(--text-sub);">${s.employee?.full_name||'—'}</td>
    </tr>`).join('');
  }

  function renderTable(){document.getElementById('stockouts-tbody').innerHTML=tableRows(filtered);document.getElementById('stockouts-count').textContent=`${filtered.length} record${filtered.length!==1?'s':''}`;}

  async function loadStockouts(){const {data}=await db.from('stock_out').select('*, product(product_name), employee(full_name)').order('stockout_date',{ascending:false});STOCKOUTS=data||[];filtered=[...STOCKOUTS];renderTable();}

  async function loadLookups(){
    const [{data:p},{data:e}]=await Promise.all([db.from('product').select('product_id,product_name,quantity').order('product_name'),db.from('employee').select('employee_id,full_name').order('full_name')]);
    PRODUCTS=p||[];EMPLOYEES=e||[];
  }

  function applyFilters(){
    const q=(document.getElementById('search-stockouts')?.value||'').toLowerCase();
    const emp=document.getElementById('filter-employee')?.value||'';
    filtered=STOCKOUTS.filter(s=>{const mQ=!q||(s.product?.product_name||'').toLowerCase().includes(q)||(s.stockout_description||'').toLowerCase().includes(q)||s.stockout_date.includes(q);const mE=!emp||String(s.employee_id)===emp;return mQ&&mE;});
    renderTable();
  }

  function openModal(){
    const today=new Date().toISOString().split('T')[0];
    document.getElementById('modalSlot').innerHTML=`
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">New Stock Out</div><button class="modal-close" id="mc">&#10005;</button></div>
          <form id="mf">
            <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="${today}" required/></div>
            <div class="form-group"><label class="form-label">Product</label>
              <select class="form-input" id="f-product">
                <option value="">— Select Product —</option>
                ${PRODUCTS.map(p=>`<option value="${p.product_id}" data-stock="${p.quantity}">${p.product_name} — ${p.quantity} units</option>`).join('')}
              </select>
              <div id="live-badge" style="display:none;margin-top:8px;padding:8px 12px;background:#161616;border:1px solid var(--border);border-radius:6px;font-size:13px;">Current Stock: <strong id="live-val" style="color:var(--amber);"></strong> units</div>
            </div>
            <div class="form-group">
              <label class="form-label">Quantity</label>
              <input class="form-input" id="f-qty" type="number" min="1" placeholder="1" required/>
              <div id="qty-err" style="display:none;color:#e53935;font-size:12px;margin-top:4px;font-weight:600;"></div>
            </div>
            <div class="form-group"><label class="form-label">Unit Price</label><input class="form-input" id="f-price" type="number" min="0" step="0.01" placeholder="0.00"/></div>
            <div class="form-group"><label class="form-label">Employee</label>
              <select class="form-input" id="f-employee">${EMPLOYEES.map(e=>`<option value="${e.employee_id}">${e.full_name}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label class="form-label">Description / Reason <span style="color:var(--amber);">*</span></label><input class="form-input" id="f-desc" type="text" placeholder="e.g. Damaged during storage..." required/></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="mc2">Cancel</button><button type="submit" class="btn btn-amber" id="btn-save">Record Stock-Out</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('mc').addEventListener('click',closeModal);
    document.getElementById('mc2').addEventListener('click',closeModal);
    document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
    document.getElementById('f-product').addEventListener('change',function(){
      const opt=this.options[this.selectedIndex];const stock=parseInt(opt.dataset.stock);
      const badge=document.getElementById('live-badge');const val=document.getElementById('live-val');
      if(this.value&&!isNaN(stock)){badge.style.display='block';val.textContent=stock;val.style.color=stock<=0?'#e53935':stock<=10?'var(--amber)':'#4caf50';document.getElementById('f-qty').max=stock;}
      else{badge.style.display='none';}
      document.getElementById('qty-err').style.display='none';
    });
    document.getElementById('f-qty').addEventListener('input',function(){
      const sel=document.getElementById('f-product');const stock=parseInt(sel.options[sel.selectedIndex]?.dataset.stock||0);
      const v=parseInt(this.value);const err=document.getElementById('qty-err');const btn=document.getElementById('btn-save');
      if(!isNaN(v)&&v>stock&&stock>0){err.textContent=`&#9888; Cannot exceed current stock (${stock} units)`;err.style.display='block';this.style.borderColor='#e53935';btn.disabled=true;btn.style.opacity='0.5';}
      else{err.style.display='none';this.style.borderColor='';btn.disabled=false;btn.style.opacity='1';}
    });
    document.getElementById('mf').addEventListener('submit',async function(e){
      e.preventDefault();
      const pid=parseInt(document.getElementById('f-product').value);const qty=parseInt(document.getElementById('f-qty').value);
      const price=parseFloat(document.getElementById('f-price').value)||null;const desc=document.getElementById('f-desc').value.trim();
      const empId=parseInt(document.getElementById('f-employee').value);const date=document.getElementById('f-date').value;
      if(!pid){showToast('Select a product.','error');return;}if(!desc){showToast('Description is required.','error');return;}
      const {data:lp}=await db.from('product').select('quantity,product_name').eq('product_id',pid).single();
      if(!lp){showToast('Product not found.','error');return;}if(qty>lp.quantity){showToast(`Only ${lp.quantity} units available.`,'error');return;}
      const {error}=await db.from('stock_out').insert({stockout_date:date,product_id:pid,quantity:qty,unit_price:price,employee_id:empId,stockout_description:desc});
      if(error){showToast('Error recording stock-out.','error');return;}
      closeModal();await loadStockouts();await loadLookups();showToast(`Stock-out recorded — ${qty} &times; ${lp.product_name}`);
    });
  }

  await loadLookups();
  document.getElementById('filter-employee').innerHTML=`<option value="">All Employees</option>${EMPLOYEES.map(e=>`<option value="${e.employee_id}">${e.full_name}</option>`).join('')}`;
  await loadStockouts();
  document.getElementById('btn-add').addEventListener('click',openModal);
  document.getElementById('search-stockouts').addEventListener('input',applyFilters);
  document.getElementById('filter-employee').addEventListener('change',applyFilters);

})();