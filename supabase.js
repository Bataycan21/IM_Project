// supabase.js — shared Supabase client used by all modules
const _sb = window.supabase.createClient(
  'https://vgprkfxmeioxevtocenp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncHJrZnhtZWlveGV2dG9jZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzM3NjMsImV4cCI6MjA4NzY0OTc2M30.KoPJ4JXgPtZ13OHAwYVukfyWQykWJ2Gzr3CAWIBuSkA'
);
window.db = _sb;