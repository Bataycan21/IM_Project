// ================================================================
//  products.js — Joe Hardware & Motorparts
// ================================================================

(async function () {

  renderShell('products');
  document.getElementById('header-title').textContent = 'Products & Point of Sale';

  const pc = document.getElementById('pageContent');
  let PRODUCTS = [], CATEGORIES = [], BRANDS = [], UNITS = [], SUPPLIERS = [];
  let filteredProducts = [], posFiltered = [];
  let cart = [], SALES_HISTORY = [];
  let activeCategory = 'ALL';

  function showToast(msg, type = 'success') {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { const m = document.getElementById('modalSlot'); if (m) m.innerHTML = ''; }
  function peso(n) { return '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 }); }
  function ensureModalSlot() { if (!document.getElementById('modalSlot')) { const d = document.createElement('div'); d.id = 'modalSlot'; document.body.appendChild(d); } }

  pc.innerHTML = `
    <div class="products-tabs">
      <button class="products-tab active" id="tab-products" onclick="window._switchTab('products')">Products</button>
      <button class="products-tab" id="tab-pos" onclick="window._switchTab('pos')">Point of Sale</button>
      <button class="products-tab" id="tab-history" onclick="window._switchTab('history')">Sales History</button>
    </div>

    <div id="panel-products">
      <div class="catalog-header">Product Catalog</div>
      <input class="catalog-search" id="search-products" type="text" placeholder="Search products..."/>
      <div class="catalog-filters">
        <select class="filter-select" id="filter-category" style="width:100%;"><option value="">All Categories</option></select>
        <select class="filter-select" id="filter-stock" style="width:100%;">
          <option value="">All Stock</option><option value="ok">In Stock</option>
          <option value="low">Low Stock</option><option value="out">Out of Stock</option>
        </select>
        <button class="btn btn-amber" id="btn-add-product">+ Add Product</button>
      </div>
      <div class="catalog-count" id="catalog-count">Loading...</div>
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-wrap">
          <table class="product-list-table">
            <thead><tr><th style="width:55%;">Product</th><th style="width:25%;">Stock</th><th style="width:20%;">Action</th></tr></thead>
            <tbody id="product-tbody"><tr><td colspan="3" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="panel-pos" style="display:none;">
      <div class="pos-layout">
        <div class="pos-left">
          <div class="pos-section-title">Point of Sale</div>
          <div class="pos-customer-label">Customer Name <span class="req">*</span></div>
          <input class="pos-customer-input" id="pos-customer-name" type="text" placeholder="Enter customer name..."/>
          <input class="catalog-search" id="pos-search" type="text" placeholder="Search products..." style="margin-bottom:10px;"/>
          <div class="category-pills" id="category-pills"></div>
          <div class="pos-product-grid" id="pos-product-grid"></div>
        </div>
        <div class="pos-right">
          <div class="sale-summary-card">
            <div class="sale-summary-header">
              <div class="sale-id" id="pos-sale-id">SALE #—</div>
              <div class="sale-date-label" id="pos-sale-date"></div>
            </div>
            <div class="sale-cart-body" id="cart-body">
              <div class="cart-empty"><div class="cart-icon">&#128722;</div><div class="cart-text">Cart is empty</div></div>
            </div>
            <div class="sale-summary-footer">
              <div class="sale-total-row">
                <div class="sale-total-label">Total</div>
                <div class="sale-total-amount" id="cart-total">$0.00</div>
              </div>
              <button class="btn-complete-sale" id="btn-complete-sale">Complete Sale</button>
              <button class="btn-clear-cart" id="btn-clear-cart">Clear Cart</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="panel-history" style="display:none;">
      <div class="sales-history-title">Sales History</div>
      <div class="sales-history-sub">Recent transactions</div>
      <div class="card" style="padding:0;overflow:hidden;">
        <table class="sales-history-table">
          <thead><tr><th style="width:36px;"></th><th>Sale ID</th><th>Customer</th><th>Date</th><th style="text-align:right;">Total</th></tr></thead>
          <tbody id="sales-history-tbody"><tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>

    <div id="modalSlot"></div>
    <div id="toast" class="toast"></div>`;

  document.getElementById('pos-sale-date').textContent = new Date().toLocaleDateString('en-US');
  ensureModalSlot();

  window._switchTab = function(tab) {
    ['products','pos','history'].forEach(t => {
      document.getElementById(`panel-${t}`).style.display = t === tab ? 'block' : 'none';
      document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    });
    if (tab === 'history') loadSalesHistory();
  };

  async function loadLookups() {
    const [{ data: c }, { data: b }, { data: u }, { data: s }] = await Promise.all([
      db.from('category').select('*').order('category_name'),
      db.from('brand').select('*').order('brand_name'),
      db.from('unit').select('*').order('unit_type'),
      db.from('supplier').select('supplier_id, supplier_name').order('supplier_name'),
    ]);
    CATEGORIES = c||[]; BRANDS = b||[]; UNITS = u||[]; SUPPLIERS = s||[];
    document.getElementById('filter-category').innerHTML =
      `<option value="">All Categories</option>${CATEGORIES.map(c=>`<option value="${c.category_id}">${c.category_name}</option>`).join('')}`;
    document.getElementById('category-pills').innerHTML =
      `<button class="category-pill active" onclick="window._filterPosCategory('ALL')">All</button>` +
      CATEGORIES.map(c=>`<button class="category-pill" onclick="window._filterPosCategory('${c.category_id}')">${c.category_name}</button>`).join('');
  }

  async function loadProducts() {
    const { data } = await db.from('product').select('*, category(category_name), brand(brand_name), unit(unit_type)').order('product_name');
    PRODUCTS = data||[]; filteredProducts=[...PRODUCTS]; posFiltered=[...PRODUCTS];
    renderProductTable(); renderPosGrid();
    document.getElementById('pos-sale-id').textContent = `SALE #${Math.floor(Math.random()*9000+1000)}`;
  }

  function applyProductFilters() {
    const q=( document.getElementById('search-products')?.value||'').toLowerCase();
    const cat=document.getElementById('filter-category')?.value||'';
    const stk=document.getElementById('filter-stock')?.value||'';
    filteredProducts=PRODUCTS.filter(p=>{
      const mQ=!q||p.product_name.toLowerCase().includes(q);
      const mC=!cat||String(p.category_id)===cat;
      const mS=!stk||(stk==='ok'&&p.quantity>p.reorder_level)||(stk==='low'&&p.quantity>0&&p.quantity<=p.reorder_level)||(stk==='out'&&p.quantity<=0);
      return mQ&&mC&&mS;
    });
    renderProductTable();
  }

  function stockBadge(p) {
    if (p.quantity<=0) return `<span class="badge badge-out-stock">Out of Stock</span>`;
    if (p.quantity<=p.reorder_level) return `<span class="badge badge-low-stock">Low Stock</span>`;
    return `<span class="badge badge-in-stock">In Stock</span>`;
  }

  function renderProductTable() {
    document.getElementById('catalog-count').textContent = `${filteredProducts.length} of ${PRODUCTS.length} products`;
    document.getElementById('product-tbody').innerHTML = !filteredProducts.length
      ? `<tr><td colspan="3" class="td-muted" style="text-align:center;padding:32px;">No products found.</td></tr>`
      : filteredProducts.map(p=>`<tr>
          <td class="product-name-cell"><div class="pname">${p.product_name}</div><div class="pprice">${peso(p.price)}</div></td>
          <td class="product-stock-cell"><div class="stock-num">${p.quantity}</div>${stockBadge(p)}</td>
          <td><button class="btn-adjust" onclick="window._openRestockModal(${p.product_id})">&#9881; Adjust</button></td>
        </tr>`).join('');
  }

  window._filterPosCategory=function(catId){
    activeCategory=catId;
    document.querySelectorAll('.category-pill').forEach(p=>{
      const m=p.getAttribute('onclick').match(/'([^']+)'/);
      p.classList.toggle('active',m?.[1]===catId);
    });
    filterPosGrid();
  };

  function filterPosGrid(){
    const q=(document.getElementById('pos-search')?.value||'').toLowerCase();
    posFiltered=PRODUCTS.filter(p=>{
      const mC=activeCategory==='ALL'||String(p.category_id)===activeCategory;
      const mQ=!q||p.product_name.toLowerCase().includes(q);
      return mC&&mQ;
    });
    renderPosGrid();
  }

  function renderPosGrid(){
    const el=document.getElementById('pos-product-grid');
    if(!el)return;
    if(!posFiltered.length){el.innerHTML=`<div class="empty-state" style="grid-column:1/-1;">No products found.</div>`;return;}
    el.innerHTML=posFiltered.map(p=>`
      <div class="pos-product-card${p.quantity<=0?' disabled':''}" onclick="window._addToCart(${p.product_id})">
        <div class="pos-product-category">${p.category?.category_name||''}</div>
        <div class="pos-product-name">${p.product_name}</div>
        <div class="pos-product-footer">
          <div class="pos-product-price">${peso(p.price)}</div>
          <div class="pos-product-stock">${p.quantity}</div>
        </div>
      </div>`).join('');
  }

  function cartTotal(){return cart.reduce((s,i)=>s+i.quantity*i.unit_price,0);}

  function renderCart(){
    document.getElementById('cart-total').textContent=peso(cartTotal());
    const body=document.getElementById('cart-body');
    if(!cart.length){body.innerHTML=`<div class="cart-empty"><div class="cart-icon">&#128722;</div><div class="cart-text">Cart is empty</div></div>`;return;}
    body.innerHTML=cart.map((item,idx)=>`
      <div class="cart-item-row">
        <div class="cart-item-name">${item.product_name}</div>
        <input type="number" class="cart-item-qty" min="1" max="${item.stock}" value="${item.quantity}" onchange="window._updateCartQty(${idx},this.value)"/>
        <div class="cart-item-total">${peso(item.quantity*item.unit_price)}</div>
        <button class="cart-item-remove" onclick="window._removeCartItem(${idx})">&#10005;</button>
      </div>`).join('');
  }

  window._addToCart=function(pid){
    const p=PRODUCTS.find(x=>x.product_id===pid);
    if(!p||p.quantity<=0){showToast('Out of stock!','error');return;}
    const ex=cart.find(c=>c.product_id===pid);
    if(ex){if(ex.quantity>=ex.stock){showToast(`Max: ${ex.stock}`,'error');return;}ex.quantity++;}
    else cart.push({product_id:p.product_id,product_name:p.product_name,quantity:1,unit_price:parseFloat(p.price),stock:p.quantity});
    renderCart();
  };
  window._removeCartItem=function(idx){cart.splice(idx,1);renderCart();};
  window._updateCartQty=function(idx,val){let v=parseInt(val);if(isNaN(v)||v<1)v=1;if(v>cart[idx].stock){v=cart[idx].stock;showToast(`Max: ${cart[idx].stock}`,'error');}cart[idx].quantity=v;renderCart();};

  document.getElementById('btn-complete-sale').addEventListener('click',async()=>{
    const name=document.getElementById('pos-customer-name').value.trim();
    if(!name){showToast('Enter customer name.','error');return;}
    if(!cart.length){showToast('Cart is empty.','error');return;}
    let customerId=null;
    const {data:ec}=await db.from('customer').select('customer_id').eq('full_name',name).maybeSingle();
    if(ec){customerId=ec.customer_id;}
    else{
      const {data:wt}=await db.from('customer_type').select('customer_type_id').eq('type_name','Walk-in').maybeSingle();
      const {data:nc}=await db.from('customer').insert({full_name:name,customer_type_id:wt?.customer_type_id||null}).select('customer_id').single();
      customerId=nc?.customer_id;
    }
    const total=cartTotal();
    const today=new Date().toISOString().split('T')[0];
    // ✅ FIX: use logged-in employee from session instead of fetching first employee
    const empId=Auth.getUser()?.employee_id||null;
    const {data:sale,error:sE}=await db.from('sale').insert({sale_date:today,total_amount:total,customer_id:customerId,employee_id:empId}).select('sale_id').single();
    if(sE){showToast('Error saving sale.','error');return;}
    const {error:iE}=await db.from('sale_item').insert(cart.map(i=>({sale_id:sale.sale_id,product_id:i.product_id,quantity:i.quantity,unit_price:i.unit_price})));
    if(iE){showToast('Error saving items.','error');return;}
    document.getElementById('modalSlot').innerHTML=`
      <div class="modal modal-open" id="modal">
        <div class="modal-box" style="max-width:420px;">
          <div class="modal-header"><div class="modal-title" style="color:#4caf50;">&#10003; Sale Complete</div><button class="modal-close" id="mc">&#10005;</button></div>
          <div style="text-align:center;margin-bottom:14px;"><div style="font-size:13px;color:var(--text-muted);">Sale #${sale.sale_id} &middot; ${today}</div><div style="font-size:15px;font-weight:700;color:#fff;margin-top:4px;">${name}</div></div>
          <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:14px;">
            <thead><tr style="border-bottom:1px solid var(--border);color:var(--text-muted);"><th style="padding:5px;text-align:left;">Product</th><th>Qty</th><th style="text-align:right;">Total</th></tr></thead>
            <tbody>${cart.map(i=>`<tr style="border-bottom:1px solid var(--border);"><td style="padding:6px 5px;color:#fff;">${i.product_name}</td><td style="text-align:center;">${i.quantity}</td><td style="text-align:right;color:#4caf50;font-weight:700;">${peso(i.quantity*i.unit_price)}</td></tr>`).join('')}</tbody>
          </table>
          <div style="display:flex;justify-content:space-between;padding:10px 5px;border-top:1px solid var(--border);margin-bottom:16px;"><strong>Total</strong><strong style="color:#4caf50;font-size:18px;">${peso(total)}</strong></div>
          <div class="modal-footer"><button class="btn-ghost" id="mc2">Close</button><button class="btn btn-amber" onclick="window.print()">&#128438; Print</button></div>
        </div>
      </div>`;
    document.getElementById('mc').addEventListener('click',closeModal);
    document.getElementById('mc2').addEventListener('click',closeModal);
    cart=[];document.getElementById('pos-customer-name').value='';
    document.getElementById('pos-sale-id').textContent=`SALE #${Math.floor(Math.random()*9000+1000)}`;
    renderCart();await loadProducts();showToast(`Sale #${sale.sale_id} saved!`);
  });

  document.getElementById('btn-clear-cart').addEventListener('click',()=>{cart=[];renderCart();document.getElementById('pos-customer-name').value='';});

  async function loadSalesHistory(){
    const {data}=await db.from('sale').select('sale_id,sale_date,total_amount,customer(full_name),sale_item(sale_item_id,quantity,unit_price,product(product_name))').order('sale_date',{ascending:false}).order('sale_id',{ascending:false}).limit(50);
    SALES_HISTORY=data||[];
    const tbody=document.getElementById('sales-history-tbody');
    if(!SALES_HISTORY.length){tbody.innerHTML=`<tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">No sales found.</td></tr>`;return;}
    tbody.innerHTML=SALES_HISTORY.map(s=>`
      <tr onclick="window._toggleDetail(${s.sale_id})" style="cursor:pointer;">
        <td><span id="chev-${s.sale_id}" style="color:var(--text-muted);font-size:14px;display:inline-block;">&#8250;</span></td>
        <td><span class="sale-row-id">#${s.sale_id}</span></td>
        <td class="sale-row-customer">${s.customer?.full_name||'Walk-in Customer'}</td>
        <td class="sale-row-date">${new Date(s.sale_date).toLocaleDateString('en-US')}</td>
        <td class="sale-row-total">${peso(s.total_amount)}</td>
      </tr>
      <tr style="background:#161616;" id="drow-${s.sale_id}">
        <td colspan="5" style="padding:0;">
          <div id="detail-${s.sale_id}" style="display:none;padding:14px 18px 14px 42px;">
            <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:10px;">
              <thead><tr style="color:var(--text-muted);border-bottom:1px solid var(--border);"><th style="padding:4px 0;text-align:left;">Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Total</th></tr></thead>
              <tbody>${(s.sale_item||[]).map(si=>`<tr style="border-bottom:1px solid var(--border);"><td style="padding:5px 0;color:#fff;">${si.product?.product_name||'?'}</td><td style="text-align:center;">${si.quantity}</td><td style="text-align:right;">${peso(si.unit_price)}</td><td style="text-align:right;color:#4caf50;font-weight:700;">${peso(si.quantity*si.unit_price)}</td></tr>`).join('')}</tbody>
            </table>
            <button class="btn btn-amber" style="font-size:11px;padding:7px 14px;" onclick="event.stopPropagation();window.location.href='returns.html?sale_id=${s.sale_id}'">&#8617; Process Return</button>
          </div>
        </td>
      </tr>`).join('');
  }

  window._toggleDetail=function(sid){
    const el=document.getElementById(`detail-${sid}`);
    const chev=document.getElementById(`chev-${sid}`);
    if(!el)return;
    const open=el.style.display==='none';
    el.style.display=open?'block':'none';
    if(chev)chev.textContent=open?'&#8964;':'&#8250;';
  };

  function openAddModal(){
    document.getElementById('modalSlot').innerHTML=`
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">&#128230; Add Product</div><button class="modal-close" id="mc">&#10005;</button></div>
          <form id="mf">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Product Name</label><input class="form-input" id="f-name" type="text" required/></div>
              <div class="form-group"><label class="form-label">Category</label><select class="form-input" id="f-cat">${CATEGORIES.map(c=>`<option value="${c.category_id}">${c.category_name}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Brand</label><select class="form-input" id="f-brand">${BRANDS.map(b=>`<option value="${b.brand_id}">${b.brand_name}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Unit</label><select class="form-input" id="f-unit">${UNITS.map(u=>`<option value="${u.unit_id}">${u.unit_type}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Price</label><input class="form-input" id="f-price" type="number" min="0" step="0.01" placeholder="0.00" required/></div>
              <div class="form-group"><label class="form-label">Initial Qty</label><input class="form-input" id="f-qty" type="number" min="0" placeholder="0" required/></div>
              <div class="form-group"><label class="form-label">Reorder Level</label><input class="form-input" id="f-reorder" type="number" min="0" placeholder="0" required/></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="mc2">Cancel</button><button type="submit" class="btn btn-amber">Save Product</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('mc').addEventListener('click',closeModal);
    document.getElementById('mc2').addEventListener('click',closeModal);
    document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
    document.getElementById('mf').addEventListener('submit',async function(e){
      e.preventDefault();
      const payload={product_name:document.getElementById('f-name').value.trim(),category_id:parseInt(document.getElementById('f-cat').value),brand_id:parseInt(document.getElementById('f-brand').value),unit_id:parseInt(document.getElementById('f-unit').value),price:parseFloat(document.getElementById('f-price').value),quantity:parseInt(document.getElementById('f-qty').value),reorder_level:parseInt(document.getElementById('f-reorder').value)};
      const {error}=await db.from('product').insert(payload);
      if(error){showToast('Error.','error');return;}
      closeModal();await loadProducts();showToast(`"${payload.product_name}" added!`);
    });
  }

  window._openRestockModal=function(pid){
    const p=PRODUCTS.find(x=>x.product_id===pid);
    if(!p)return;
    const today=new Date().toISOString().split('T')[0];
    document.getElementById('modalSlot').innerHTML=`
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">&#9881; Adjust Stock</div><button class="modal-close" id="mc">&#10005;</button></div>
          <div style="background:#161616;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:16px;">
            <div style="font-weight:700;color:#fff;">${p.product_name}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">Current stock: <strong style="color:var(--amber);">${p.quantity} units</strong></div>
          </div>
          <form id="mf">
            <div class="form-group"><label class="form-label">Qty to Add</label><input class="form-input" id="f-qty" type="number" min="1" placeholder="50" required/></div>
            <div class="form-group"><label class="form-label">Unit Cost</label><input class="form-input" id="f-cost" type="number" min="0" step="0.01" placeholder="0.00" required/></div>
            <div class="form-group"><label class="form-label">Supplier</label>
              <select class="form-input" id="f-sup"><option value="">— Select —</option>${SUPPLIERS.map(s=>`<option value="${s.supplier_id}">${s.supplier_name}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="${today}" required/></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="mc2">Cancel</button><button type="submit" class="btn btn-amber">Confirm Restock</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('mc').addEventListener('click',closeModal);
    document.getElementById('mc2').addEventListener('click',closeModal);
    document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
    document.getElementById('mf').addEventListener('submit',async function(e){
      e.preventDefault();
      const qty=parseInt(document.getElementById('f-qty').value);
      const cost=parseFloat(document.getElementById('f-cost').value);
      const suppId=document.getElementById('f-sup').value;
      const date=document.getElementById('f-date').value;
      if(!suppId){showToast('Select a supplier.','error');return;}
      // ✅ FIX: use logged-in employee from session instead of fetching first employee
      const empId=Auth.getUser()?.employee_id||null;
      const {data:supply,error:sE}=await db.from('supply').insert({supply_date:date,total_amount:qty*cost,supplier_id:parseInt(suppId),employee_id:empId}).select('supply_id').single();
      if(sE){showToast('Error.','error');return;}
      await db.from('supply_item').insert({supply_id:supply.supply_id,product_id:p.product_id,quantity:qty,unit_price:cost});
      closeModal();await loadProducts();showToast(`+${qty} units added!`);
    });
  };

  document.getElementById('btn-add-product').addEventListener('click',openAddModal);
  document.getElementById('search-products').addEventListener('input',applyProductFilters);
  document.getElementById('filter-category').addEventListener('change',applyProductFilters);
  document.getElementById('filter-stock').addEventListener('change',applyProductFilters);
  document.getElementById('pos-search').addEventListener('input',filterPosGrid);

  await loadLookups();
  await loadProducts();

})();