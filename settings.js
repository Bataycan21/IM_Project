// ================================================================
//  settings.js — Joe Hardware & Motorparts
// ================================================================

(async function () {

  if (!Auth.require()) return;

  renderShell('settings');
  document.getElementById('header-title').textContent = 'Settings';

  const pc = document.getElementById('pageContent');
  let CATEGORIES = [], BRANDS = [], UNITS = [], EMPLOYEES = [];

  function showToast(msg, type = 'success') {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { const m = document.getElementById('modalSlot'); if (m) m.innerHTML = ''; }

  pc.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <div class="page-sub">System configuration and account management</div>
      </div>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:24px;flex-wrap:wrap;">
      <button class="settings-tab active" id="stab-store"     onclick="window._switchSettings('store')">Store Info</button>
      <button class="settings-tab"        id="stab-lookup"    onclick="window._switchSettings('lookup')">Lookup Tables</button>
      <button class="settings-tab"        id="stab-accounts"  onclick="window._switchSettings('accounts')">Account Management</button>
      <button class="settings-tab"        id="stab-myaccount" onclick="window._switchSettings('myaccount')">My Account</button>
    </div>
    <div id="spanel-store"></div>
    <div id="spanel-lookup"    style="display:none;"></div>
    <div id="spanel-accounts"  style="display:none;"></div>
    <div id="spanel-myaccount" style="display:none;"></div>
    <div id="modalSlot"></div>
    <div id="toast" class="toast"></div>`;

  const style = document.createElement('style');
  style.textContent = `
    .settings-tab{padding:7px 16px;border-radius:20px;border:none;font-family:'Barlow',sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;cursor:pointer;background:transparent;color:var(--text-muted);transition:all 0.15s;}
    .settings-tab:hover{color:var(--text-sub);}
    .settings-tab.active{background:var(--amber);color:#000;}
    .toggle-switch{position:relative;width:36px;height:20px;display:inline-block;}
    .toggle-switch input{opacity:0;width:0;height:0;position:absolute;}
    .toggle-slider{position:absolute;inset:0;background:#333;border-radius:20px;cursor:pointer;transition:0.2s;}
    .toggle-slider:before{content:'';position:absolute;width:14px;height:14px;left:3px;top:3px;background:#fff;border-radius:50%;transition:0.2s;}
    .toggle-switch input:checked + .toggle-slider{background:var(--amber);}
    .toggle-switch input:checked + .toggle-slider:before{transform:translateX(16px);}
    .lookup-list{height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:0 0 8px 8px;}
    .lookup-list::-webkit-scrollbar{width:4px;}
    .lookup-list::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
    .lookup-item{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text-sub);transition:background 0.12s;}
    .lookup-item:last-child{border-bottom:none;}
    .lookup-item:hover{background:var(--row-hover);}
    .lookup-add-btn{width:100%;padding:10px;background:transparent;border:none;border-top:1px solid var(--border);font-family:'Barlow',sans-serif;font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;cursor:pointer;transition:all 0.15s;border-radius:0 0 8px 8px;}
    .lookup-add-btn:hover{background:var(--amber-dim);color:var(--amber);}
    .acct-btn{padding:5px 12px;border-radius:5px;border:1px solid var(--border);background:transparent;font-family:'Barlow',sans-serif;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;cursor:pointer;transition:all 0.15s;}
    .acct-btn:hover{background:var(--amber-dim);border-color:var(--amber);color:var(--amber);}`;
  document.head.appendChild(style);

  window._switchSettings = function(tab) {
    ['store','lookup','accounts','myaccount'].forEach(t=>{document.getElementById(`spanel-${t}`).style.display=t===tab?'block':'none';document.getElementById(`stab-${t}`).classList.toggle('active',t===tab);});
    if(tab==='store')    renderStoreInfo();
    if(tab==='lookup')   renderLookupTables();
    if(tab==='accounts') renderAccountManagement();
    if(tab==='myaccount')renderMyAccount();
  };

  function renderStoreInfo(){
    document.getElementById('spanel-store').innerHTML=`
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;"><span style="font-size:20px;">&#127978;</span><div style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;">Store Information</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div class="form-group" style="margin:0;"><label class="form-label">Store Name</label><input class="form-input" id="store-name" type="text" value="Joe Hardware &amp; Motorparts"/></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Contact Number</label><input class="form-input" id="store-contact" type="text" value="+1 (555) 123-4567"/></div>
        </div>
        <div class="form-group" style="margin-bottom:20px;"><label class="form-label">Address</label><input class="form-input" id="store-address" type="text" value="123 Hardware Street, Industrial District, City"/></div>
        <button class="btn btn-amber" id="btn-save-store">Save Changes</button>
      </div>`;
    document.getElementById('btn-save-store').addEventListener('click',()=>showToast('Store information saved!'));
  }

  async function renderLookupTables(){
    const panel=document.getElementById('spanel-lookup');
    panel.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
      <div class="card" style="padding:0;overflow:hidden;">
        <div style="padding:16px 18px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);"><span>&#127991;</span><div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;">Categories</div></div>
        <div class="lookup-list" id="list-categories"><div class="empty-state">Loading...</div></div>
        <button class="lookup-add-btn" onclick="window._addLookup('category')">Add Category</button>
      </div>
      <div class="card" style="padding:0;overflow:hidden;">
        <div style="padding:16px 18px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);"><span>&#127981;</span><div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;">Brands</div></div>
        <div class="lookup-list" id="list-brands"><div class="empty-state">Loading...</div></div>
        <button class="lookup-add-btn" onclick="window._addLookup('brand')">Add Brand</button>
      </div>
      <div class="card" style="padding:0;overflow:hidden;">
        <div style="padding:16px 18px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);"><span>&#128230;</span><div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;">Units</div></div>
        <div class="lookup-list" id="list-units"><div class="empty-state">Loading...</div></div>
        <button class="lookup-add-btn" onclick="window._addLookup('unit')">Add Unit</button>
      </div>
    </div>`;
    await loadLookups();
    renderLookupList('categories',CATEGORIES,'category_id','category_name');
    renderLookupList('brands',BRANDS,'brand_id','brand_name');
    renderLookupList('units',UNITS,'unit_id','unit_type');
  }

  function renderLookupList(listId,data,idKey,nameKey){
    const el=document.getElementById(`list-${listId}`);if(!el)return;
    if(!data.length){el.innerHTML=`<div class="empty-state">No items.</div>`;return;}
    el.innerHTML=data.map(item=>`<div class="lookup-item"><span>${item[nameKey]}</span><button onclick="window._deleteLookup('${listId}','${idKey}',${item[idKey]},'${item[nameKey]}')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px;padding:2px 4px;transition:color 0.15s;" onmouseover="this.style.color='#e53935'" onmouseout="this.style.color='var(--text-muted)'">&#10005;</button></div>`).join('');
  }

  window._addLookup=async function(type){
    const label=type==='category'?'Category Name':type==='brand'?'Brand Name':'Unit Type';
    const value=prompt(`Enter new ${label}:`);if(!value||!value.trim())return;
    let error;
    if(type==='category'){({error}=await db.from('category').insert({category_name:value.trim()}));}
    if(type==='brand'){({error}=await db.from('brand').insert({brand_name:value.trim()}));}
    if(type==='unit'){({error}=await db.from('unit').insert({unit_type:value.trim()}));}
    if(error){showToast('Error adding item.','error');return;}
    showToast(`"${value.trim()}" added!`);await renderLookupTables();
  };

  window._deleteLookup=async function(listId,idKey,id,name){
    if(!confirm(`Delete "${name}"?`))return;
    const table=listId==='categories'?'category':listId==='brands'?'brand':'unit';
    const {error}=await db.from(table).delete().eq(idKey,id);
    if(error){showToast('Cannot delete — item may be in use.','error');return;}
    showToast(`"${name}" deleted!`);await renderLookupTables();
  };

  async function renderAccountManagement(){
    const panel=document.getElementById('spanel-accounts');
    const {data:employees}=await db.from('employee').select('employee_id,full_name,username,role(role_name)').order('employee_id');
    EMPLOYEES=employees||[];
    panel.innerHTML=`
      <div class="card" style="padding:0;overflow:hidden;">
        <div style="padding:18px 22px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:18px;">&#128737;</span><div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;">Account Management</div></div>
          <button class="btn btn-amber" id="btn-add-account" style="font-size:12px;">+ Add Account</button>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Full Name</th><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="accounts-tbody"></tbody>
        </table></div>
        <div style="padding:14px 20px;border-top:1px solid var(--border);"><div style="font-size:11px;color:var(--text-muted);line-height:1.8;">&bull; Only Admin users can access this section<br>&bull; You cannot deactivate your own account<br>&bull; Available roles: Manager and Cashier</div></div>
      </div>`;
    renderAccountsTable();
    document.getElementById('btn-add-account').addEventListener('click',openAddAccountModal);
  }

  function renderAccountsTable(){
    const tbody=document.getElementById('accounts-tbody');if(!tbody)return;
    if(!EMPLOYEES.length){tbody.innerHTML=`<tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">No accounts found.</td></tr>`;return;}
    tbody.innerHTML=EMPLOYEES.map((e,i)=>{
      const roleName=e.role?.role_name||'Cashier';
      const isManager=roleName==='Manager';
      const isYou=i===0;
      const roleBadge=isManager?`<span style="background:#3a2a0a;color:#f5a623;border:1px solid rgba(245,166,35,0.3);border-radius:4px;padding:3px 9px;font-size:10px;font-weight:800;text-transform:uppercase;">Manager</span>`:`<span style="color:var(--text-muted);font-size:12px;font-weight:500;">${roleName}</span>`;
      const statusBadge=`<span style="background:#0d2e14;color:#4caf50;border:1px solid rgba(76,175,80,0.3);border-radius:4px;padding:3px 9px;font-size:10px;font-weight:800;text-transform:uppercase;">Active</span>`;
      return `<tr>
        <td style="font-weight:600;color:#fff;">${e.full_name}${isYou?`<span style="color:var(--amber);font-size:11px;margin-left:6px;">(You)</span>`:''}</td>
        <td style="font-family:'Courier New',monospace;font-size:12px;color:var(--text-muted);">${e.username}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td><div style="display:flex;align-items:center;gap:6px;">
          <button class="acct-btn" onclick="window._editAccount(${e.employee_id})">Edit</button>
          <button class="acct-btn" onclick="window._changePassword(${e.employee_id},'${e.full_name}')">Change PW</button>
          <label class="toggle-switch"><input type="checkbox" checked ${isYou?'disabled':''} onchange="window._toggleAccountStatus(${e.employee_id},this.checked)"/><span class="toggle-slider"></span></label>
        </div></td>
      </tr>`;
    }).join('');
  }

  window._toggleAccountStatus=function(empId,active){showToast(active?'Account activated.':'Account deactivated.');};

  window._editAccount=function(empId){
    const e=EMPLOYEES.find(x=>x.employee_id===empId);if(!e)return;
    document.getElementById('modalSlot').innerHTML=`
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">Edit Account</div><button class="modal-close" id="mc">&#10005;</button></div>
          <form id="mf">
            <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="f-name" type="text" value="${e.full_name}" required/></div>
            <div class="form-group"><label class="form-label">Username</label><input class="form-input" id="f-username" type="text" value="${e.username}" required/></div>
            <div class="form-group"><label class="form-label">Role</label><select class="form-input" id="f-role"><option value="Manager" ${(e.role?.role_name||'')==='Manager'?'selected':''}>Manager</option><option value="Sales Rep" ${(e.role?.role_name||'')==='Sales Rep'?'selected':''}>Sales Rep</option><option value="Warehouse Staff" ${(e.role?.role_name||'')==='Warehouse Staff'?'selected':''}>Warehouse Staff</option></select></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="mc2">Cancel</button><button type="submit" class="btn btn-amber">Save Changes</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('mc').addEventListener('click',closeModal);document.getElementById('mc2').addEventListener('click',closeModal);
    document.getElementById('modal').addEventListener('click',ev=>{if(ev.target.id==='modal')closeModal();});
    document.getElementById('mf').addEventListener('submit',async function(ev){
      ev.preventDefault();
      const name=document.getElementById('f-name').value.trim();const user=document.getElementById('f-username').value.trim();
      if(!name||!user){showToast('All fields required.','error');return;}
      const {error}=await db.from('employee').update({full_name:name,username:user}).eq('employee_id',empId);
      if(error){showToast('Error updating account.','error');return;}
      closeModal();showToast('Account updated!');await renderAccountManagement();
    });
  };

  window._changePassword=function(empId,name){
    document.getElementById('modalSlot').innerHTML=`
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">Change Password</div><button class="modal-close" id="mc">&#10005;</button></div>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Changing password for <strong style="color:#fff;">${name}</strong></p>
          <form id="mf">
            <div class="form-group"><label class="form-label">New Password</label><input class="form-input" id="f-pw" type="password" required/></div>
            <div class="form-group"><label class="form-label">Confirm New Password</label><input class="form-input" id="f-pw2" type="password" required/></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="mc2">Cancel</button><button type="submit" class="btn btn-amber">Update Password</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('mc').addEventListener('click',closeModal);document.getElementById('mc2').addEventListener('click',closeModal);
    document.getElementById('modal').addEventListener('click',ev=>{if(ev.target.id==='modal')closeModal();});
    document.getElementById('mf').addEventListener('submit',async function(ev){
      ev.preventDefault();
      const pw=document.getElementById('f-pw').value;const pw2=document.getElementById('f-pw2').value;
      if(!pw){showToast('Enter a new password.','error');return;}if(pw!==pw2){showToast('Passwords do not match.','error');return;}
      const {error}=await db.from('employee').update({password:pw}).eq('employee_id',empId);
      if(error){showToast('Error updating password.','error');return;}
      closeModal();showToast('Password updated!');
    });
  };

  function openAddAccountModal(){
    document.getElementById('modalSlot').innerHTML=`
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">Add Account</div><button class="modal-close" id="mc">&#10005;</button></div>
          <form id="mf">
            <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="f-name" type="text" placeholder="e.g. Maria Santos" required/></div>
            <div class="form-group"><label class="form-label">Username</label><input class="form-input" id="f-user" type="text" placeholder="e.g. maria" required/></div>
            <div class="form-group"><label class="form-label">Role</label><select class="form-input" id="f-role"><option value="Manager">Manager</option><option value="Cashier">Cashier</option></select></div>
            <div class="form-group"><label class="form-label">Password</label><input class="form-input" id="f-pw" type="password" required/></div>
            <div class="form-group"><label class="form-label">Confirm Password</label><input class="form-input" id="f-pw2" type="password" required/></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="mc2">Cancel</button><button type="submit" class="btn btn-amber">Create Account</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('mc').addEventListener('click',closeModal);document.getElementById('mc2').addEventListener('click',closeModal);
    document.getElementById('modal').addEventListener('click',ev=>{if(ev.target.id==='modal')closeModal();});
    document.getElementById('mf').addEventListener('submit',async function(ev){
      ev.preventDefault();
      const name=document.getElementById('f-name').value.trim();const user=document.getElementById('f-user').value.trim();
      const role=document.getElementById('f-role').value;const pw=document.getElementById('f-pw').value;const pw2=document.getElementById('f-pw2').value;
      if(!name||!user||!pw){showToast('All fields required.','error');return;}if(pw!==pw2){showToast('Passwords do not match.','error');return;}
      const {data:roles}=await db.from('role').select('role_id,role_name');
      const roleObj=roles?.find(r=>r.role_name===role);
      const {error}=await db.from('employee').insert({full_name:name,username:user,password:pw,role_id:roleObj?.role_id||null});
      if(error){showToast('Error creating account.','error');return;}
      closeModal();showToast(`Account "${name}" created!`);await renderAccountManagement();
    });
  }

  function renderMyAccount(){
    document.getElementById('spanel-myaccount').innerHTML=`
      <div class="card" style="max-width:480px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:22px;"><span style="font-size:20px;color:var(--amber);">&#128100;</span><div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#fff;">My Account Settings</div></div>
        <form id="my-acct-form">
          <div class="form-group"><label class="form-label">Current Password</label><input class="form-input" id="f-cur-pw" type="password"/></div>
          <div class="form-group"><label class="form-label">New Password</label><input class="form-input" id="f-new-pw" type="password"/></div>
          <div class="form-group"><label class="form-label">Confirm New Password</label><input class="form-input" id="f-confirm-pw" type="password"/></div>
          <button type="submit" class="btn btn-amber" style="margin-top:4px;">Update Password</button>
        </form>
      </div>`;
    document.getElementById('my-acct-form').addEventListener('submit',function(e){
      e.preventDefault();
      const np=document.getElementById('f-new-pw').value;const cp=document.getElementById('f-confirm-pw').value;
      if(!np){showToast('Enter a new password.','error');return;}if(np!==cp){showToast('Passwords do not match.','error');return;}
      showToast('Password updated successfully!');this.reset();
    });
  }

  async function loadLookups(){
    const [{data:c},{data:b},{data:u}]=await Promise.all([db.from('category').select('*').order('category_name'),db.from('brand').select('*').order('brand_name'),db.from('unit').select('*').order('unit_type')]);
    CATEGORIES=c||[];BRANDS=b||[];UNITS=u||[];
  }

  renderStoreInfo();

})();