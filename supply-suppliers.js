// ================================================================
//  supply-suppliers.js — Joe Hardware & Motorparts
// ================================================================

(async function () {

  renderShell('supply-suppliers');
  document.getElementById('header-title').textContent = 'Supply & Suppliers';

  const pc = document.getElementById('pageContent');
  let SUPPLIERS = [], SUPPLIES = [], PRODUCTS = [], EMPLOYEES = [];
  let filteredSuppliers = [], filteredSupplies = [];
  let activeTab = 'suppliers';

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
        <h1 class="page-title">Supply &amp; Suppliers</h1>
        <div class="page-sub">Manage supply orders and supplier relationships</div>
      </div>
      <button class="btn btn-amber" id="btn-add">+ Add Supplier</button>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:28px;">
      <button id="tab-suppliers" onclick="window._switchTab('suppliers')" style="padding:7px 16px;border-radius:20px;border:none;font-family:'Barlow',sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;cursor:pointer;background:var(--amber);color:#000;transition:all 0.15s;">Suppliers</button>
      <button id="tab-supplies"  onclick="window._switchTab('supplies')"  style="padding:7px 16px;border-radius:20px;border:none;font-family:'Barlow',sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;cursor:pointer;background:transparent;color:var(--text-muted);transition:all 0.15s;">Supply Orders</button>
    </div>
    <div id="panel-suppliers">
      <div class="card" style="padding:0;overflow:hidden;"><div class="table-wrap">
        <table><thead><tr><th style="width:50px;">ID</th><th>Name</th><th>Contact</th><th>Address</th><th>Total Supplies</th><th>Last Supply</th></tr></thead>
        <tbody id="suppliers-tbody"><tr><td colspan="6" class="td-muted" style="text-align:center;padding:40px;">Loading...</td></tr></tbody></table>
      </div></div>
    </div>
    <div id="panel-supplies" style="display:none;">
      <div class="card" style="padding:0;overflow:hidden;"><div class="table-wrap">
        <table><thead><tr><th style="width:36px;"></th><th>Supply ID</th><th>Date</th><th>Time</th><th>Supplier</th><th>Received By</th><th style="text-align:center;">Items</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody id="supplies-tbody"><tr><td colspan="8" class="td-muted" style="text-align:center;padding:40px;">Loading...</td></tr></tbody></table>
      </div></div>
    </div>
    <div id="modalSlot"></div>
    <div id="toast" class="toast"></div>`;

  window._switchTab = function(tab) {
    activeTab=tab;
    const isSup=tab==='suppliers';
    document.getElementById('panel-suppliers').style.display=isSup?'block':'none';
    document.getElementById('panel-supplies').style.display=isSup?'none':'block';
    document.getElementById('tab-suppliers').style.background=isSup?'var(--amber)':'transparent';
    document.getElementById('tab-suppliers').style.color=isSup?'#000':'var(--text-muted)';
    document.getElementById('tab-supplies').style.background=!isSup?'var(--amber)':'transparent';
    document.getElementById('tab-supplies').style.color=!isSup?'#000':'var(--text-muted)';
    document.getElementById('btn-add').textContent=isSup?'+ Add Supplier':'+ New Supply Order';
  };

  async function loadLookups() {
    const [{data:p},{data:e}]=await Promise.all([db.from('product').select('product_id,product_name,quantity').order('product_name'),db.from('employee').select('employee_id,full_name').order('full_name')]);
    PRODUCTS=p||[];EMPLOYEES=e||[];
  }

  async function loadSuppliers() {
    const {data}=await db.from('supplier').select('*').order('supplier_name');
    SUPPLIERS=data||[];filteredSuppliers=[...SUPPLIERS];renderSuppliers();
  }

  async function renderSuppliers() {
    const tbody=document.getElementById('suppliers-tbody');
    tbody.innerHTML=`<tr><td colspan="6" class="td-muted" style="text-align:center;padding:20px;">Loading...</td></tr>`;
    const {data:supplyStats}=await db.from('supply').select('supplier_id,supply_date,total_amount').in('supplier_id',filteredSuppliers.map(s=>s.supplier_id));
    tbody.innerHTML=filteredSuppliers.map((s,i)=>{
      const stats=(supplyStats||[]).filter(x=>x.supplier_id===s.supplier_id);
      const totalAmt=stats.reduce((sum,x)=>sum+parseFloat(x.total_amount||0),0);
      const lastDate=stats.length?stats.sort((a,b)=>b.supply_date.localeCompare(a.supply_date))[0].supply_date:'—';
      return `<tr><td style="color:var(--text-muted);">${i+1}</td><td style="font-weight:600;color:#fff;">${s.supplier_name}</td><td style="color:var(--text-sub);">${s.contact_number||'—'}</td><td style="color:var(--text-muted);">${s.address||'—'}</td><td style="color:var(--amber);font-weight:700;">${peso(totalAmt)}</td><td style="color:var(--text-muted);">${lastDate}</td></tr>`;
    }).join('');
  }

  async function loadSupplies() {
    const {data}=await db.from('supply').select('*, supplier(supplier_name), employee(full_name), supply_item(supply_item_id,quantity,unit_price,product(product_name))').order('supply_date',{ascending:false});
    SUPPLIES=data||[];filteredSupplies=[...SUPPLIES];renderSupplies();
  }

  function renderSupplies() {
    const tbody=document.getElementById('supplies-tbody');
    if(!filteredSupplies.length){tbody.innerHTML=`<tr><td colspan="8" class="td-muted" style="text-align:center;padding:40px;">No supply orders found.</td></tr>`;return;}
    tbody.innerHTML=filteredSupplies.map(s=>{
      const items=s.supply_item||[];
      return `<tr onclick="window._toggleSupplyDetail(${s.supply_id})" style="cursor:pointer;">
        <td><span id="schev-${s.supply_id}" style="color:var(--text-muted);font-size:14px;display:inline-block;">&#8250;</span></td>
        <td><span style="color:var(--amber);font-weight:700;">#${s.supply_id}</span></td>
        <td style="color:var(--text-sub);">${s.supply_date}</td>
        <td style="color:var(--text-muted);">${formatTime(s.supply_date)}</td>
        <td style="font-weight:600;color:#fff;">${s.supplier?.supplier_name||'—'}</td>
        <td style="color:var(--text-sub);">${s.employee?.full_name||'—'}</td>
        <td style="text-align:center;">${items.length}</td>
        <td style="text-align:right;color:#4caf50;font-weight:700;">${peso(s.total_amount)}</td>
      </tr>
      <tr id="sdetail-row-${s.supply_id}" style="background:#161616;display:none;">
        <td colspan="8" style="padding:0;">
          <div style="padding:14px 20px 16px 52px;">
            <div style="font-size:11px;font-weight:800;color:var(--amber);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Supply Items</div>
            ${items.map(item=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
              <div><div style="font-size:13px;font-weight:600;color:#fff;">${item.product?.product_name||'?'}</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${item.quantity} &times; ${peso(item.unit_price)}</div></div>
              <div style="color:#4caf50;font-weight:700;">${peso(item.quantity*item.unit_price)}</div>
            </div>`).join('')}
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  window._toggleSupplyDetail=function(supplyId){
    const row=document.getElementById(`sdetail-row-${supplyId}`);
    const chev=document.getElementById(`schev-${supplyId}`);
    if(!row)return;
    const isOpen=row.style.display==='none';
    row.style.display=isOpen?'table-row':'none';
    if(chev)chev.textContent=isOpen?'&#8963;':'&#8250;';
  };

  function openAddSupplierModal(){
    document.getElementById('modalSlot').innerHTML=`
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">Add Supplier</div><button class="modal-close" id="mc">&#10005;</button></div>
          <form id="mf">
            <div class="form-group"><label class="form-label">Supplier Name</label><input class="form-input" id="f-name" type="text" required/></div>
            <div class="form-group"><label class="form-label">Contact Number</label><input class="form-input" id="f-contact" type="text"/></div>
            <div class="form-group"><label class="form-label">Address</label><input class="form-input" id="f-address" type="text"/></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="mc2">Cancel</button><button type="submit" class="btn btn-amber">Save Supplier</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('mc').addEventListener('click',closeModal);
    document.getElementById('mc2').addEventListener('click',closeModal);
    document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
    document.getElementById('mf').addEventListener('submit',async function(e){
      e.preventDefault();
      const name=document.getElementById('f-name').value.trim();
      if(!name){showToast('Name required.','error');return;}
      const {error}=await db.from('supplier').insert({supplier_name:name,contact_number:document.getElementById('f-contact').value.trim(),address:document.getElementById('f-address').value.trim()});
      if(error){showToast('Error.','error');return;}
      closeModal();await loadSuppliers();showToast(`"${name}" added!`);
    });
  }

  function openNewSupplyModal(){
    const today=new Date().toISOString().split('T')[0];
    let supplyItems=[];
    function supplyTotal(){return supplyItems.reduce((s,i)=>s+i.qty*i.price,0);}
    function renderCart(){
      const el=document.getElementById('supply-cart');
      document.getElementById('supply-total').textContent=peso(supplyTotal());
      if(!supplyItems.length){el.innerHTML=`<div style="text-align:center;color:var(--text-muted);padding:16px;font-size:13px;">No items added yet.</div>`;return;}
      el.innerHTML=supplyItems.map((item,idx)=>`
        <div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--border);">
          <span style="flex:1;font-size:13px;font-weight:600;color:#fff;">${item.name}</span>
          <input type="number" min="1" value="${item.qty}" style="width:56px;background:#252525;border:1px solid var(--input-border);color:#fff;padding:4px 6px;border-radius:5px;text-align:center;font-size:12px;" onchange="window._siQty(${idx},this.value)"/>
          <span style="font-size:11px;color:var(--text-muted);">&times; $</span>
          <input type="number" min="0" step="0.01" value="${item.price}" style="width:70px;background:#252525;border:1px solid var(--input-border);color:#fff;padding:4px 6px;border-radius:5px;text-align:center;font-size:12px;" onchange="window._siPrice(${idx},this.value)"/>
          <span style="font-size:12px;color:var(--amber);font-weight:700;min-width:64px;text-align:right;">${peso(item.qty*item.price)}</span>
          <button onclick="supplyItems.splice(${idx},1);renderCart();" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px;padding:2px 4px;" onmouseover="this.style.color='#e53935'" onmouseout="this.style.color='var(--text-muted)'">&#10005;</button>
        </div>`).join('');
    }
    window._siQty=(idx,v)=>{supplyItems[idx].qty=Math.max(1,parseInt(v)||1);renderCart();};
    window._siPrice=(idx,v)=>{supplyItems[idx].price=Math.max(0,parseFloat(v)||0);renderCart();};

    document.getElementById('modalSlot').innerHTML=`
      <div class="modal modal-open" id="modal" style="align-items:flex-start;padding-top:40px;">
        <div class="modal-box" style="max-width:580px;width:95%;">
          <div class="modal-header"><div class="modal-title">New Supply Order</div><button class="modal-close" id="mc">&#10005;</button></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div class="form-group" style="margin:0;"><label class="form-label">Supplier</label>
              <select class="form-input" id="f-supplier"><option value="">— Select Supplier —</option>${SUPPLIERS.map(s=>`<option value="${s.supplier_id}">${s.supplier_name}</option>`).join('')}</select>
            </div>
            <div class="form-group" style="margin:0;"><label class="form-label">Date Received</label><input class="form-input" id="f-date" type="date" value="${today}"/></div>
          </div>
          <div style="background:#161616;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:14px;">
            <div style="font-size:11px;font-weight:800;color:var(--amber);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Add Product</div>
            <div style="display:grid;grid-template-columns:1fr 70px auto;gap:8px;align-items:flex-end;">
              <select class="form-input" id="f-add-product"><option value="">Select product...</option>${PRODUCTS.map(p=>`<option value="${p.product_id}">${p.product_name} (Stock: ${p.quantity})</option>`).join('')}</select>
              <input class="form-input" id="f-add-qty" type="number" min="1" placeholder="Qty" style="text-align:center;"/>
              <button class="btn btn-amber" id="btn-add-item" type="button">+ Add</button>
            </div>
          </div>
          <div id="supply-cart" style="min-height:40px;max-height:200px;overflow-y:auto;margin-bottom:12px;"><div style="text-align:center;color:var(--text-muted);padding:16px;font-size:13px;">No items added yet.</div></div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid var(--border);margin-bottom:16px;">
            <span style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Total</span>
            <span id="supply-total" style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#4caf50;">$0.00</span>
          </div>
          <div class="modal-footer"><button class="btn-ghost" id="mc2">Cancel</button><button class="btn btn-amber" id="btn-confirm-supply">&#10003; Confirm Receipt</button></div>
        </div>
      </div>`;
    document.getElementById('mc').addEventListener('click',closeModal);
    document.getElementById('mc2').addEventListener('click',closeModal);
    document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
    document.getElementById('btn-add-item').addEventListener('click',()=>{
      const pid=parseInt(document.getElementById('f-add-product').value);
      const qty=parseInt(document.getElementById('f-add-qty').value)||1;
      if(!pid){showToast('Select a product.','error');return;}
      const p=PRODUCTS.find(x=>x.product_id===pid);if(!p)return;
      const ex=supplyItems.find(i=>i.pid===pid);
      if(ex){ex.qty+=qty;}else{supplyItems.push({pid,name:p.product_name,qty,price:0});}
      renderCart();document.getElementById('f-add-qty').value='';
    });
    document.getElementById('btn-confirm-supply').addEventListener('click',async()=>{
      const suppId=document.getElementById('f-supplier').value;
      const date=document.getElementById('f-date').value;
      if(!suppId){showToast('Select a supplier.','error');return;}
      if(!supplyItems.length){showToast('Add at least one item.','error');return;}
      const total=supplyTotal();
      const empId=EMPLOYEES[0]?.employee_id||null;
      const {data:supply,error:sE}=await db.from('supply').insert({supply_date:date,total_amount:total,supplier_id:parseInt(suppId),employee_id:empId}).select('supply_id').single();
      if(sE){showToast('Error.','error');return;}
      const {error:iE}=await db.from('supply_item').insert(supplyItems.map(i=>({supply_id:supply.supply_id,product_id:i.pid,quantity:i.qty,unit_price:i.price})));
      if(iE){showToast('Error saving items.','error');return;}
      closeModal();await loadSupplies();showToast(`Supply order #${supply.supply_id} saved!`);
    });
  }

  document.getElementById('btn-add').addEventListener('click',()=>{if(activeTab==='suppliers')openAddSupplierModal();else openNewSupplyModal();});

  await loadLookups();
  await loadSuppliers();
  await loadSupplies();

})();