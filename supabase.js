// supabase.js — shared Supabase client used by all modules
const _sb = window.supabase.createClient(
  'https://vgprkfxmeioxevtocenp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncHJrZnhtZWlveGV2dG9jZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzM3NjMsImV4cCI6MjA4NzY0OTc2M30.KoPJ4JXgPtZ13OHAwYVukfyWQykWJ2Gzr3CAWIBuSkA'
);
window.db = _sb;

// ── Global error boundary ─────────────────────────────────────
window.addEventListener('error', function(e) {
  const app = document.getElementById('app');
  if (app) app.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d0f14;color:#fff;font-family:sans-serif;text-align:center;padding:40px;">
      <div style="font-size:42px;margin-bottom:12px;">⚙️</div>
      <div style="font-size:20px;font-weight:800;color:#d42b2b;margin-bottom:8px;">App Error</div>
      <div style="font-size:13px;color:#aaa;margin-bottom:16px;max-width:500px;">${e.message}</div>
      <div style="font-size:11px;background:#181c27;border:1px solid #252a38;border-radius:8px;padding:10px 16px;color:#6b7280;max-width:600px;word-break:break-all;">${e.filename} : line ${e.lineno}</div>
      <button onclick="location.reload()" style="margin-top:20px;padding:10px 24px;background:#d42b2b;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;">🔄 Retry</button>
    </div>`;
});

window.addEventListener('unhandledrejection', function(e) {
  const app = document.getElementById('app');
  if (app) app.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d0f14;color:#fff;font-family:sans-serif;text-align:center;padding:40px;">
      <div style="font-size:42px;margin-bottom:12px;">⚙️</div>
      <div style="font-size:20px;font-weight:800;color:#d42b2b;margin-bottom:8px;">Connection Error</div>
      <div style="font-size:13px;color:#aaa;margin-bottom:16px;max-width:500px;">${e.reason?.message || 'Failed to connect to database.'}</div>
      <button onclick="location.reload()" style="margin-top:20px;padding:10px 24px;background:#d42b2b;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;">🔄 Retry</button>
    </div>`;
});