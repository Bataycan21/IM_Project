// ================================================================
//  supabase.js — Joe Hardware & Motorparts
//  Connected to IM Database
// ================================================================

const SUPABASE_URL = 'https://vgprkfxmeioxevtocenp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncHJrZnhtZWlveGV2dG9jZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzM3NjMsImV4cCI6MjA4NzY0OTc2M30.KoPJ4JXgPtZ13OHAwYVukfyWQykWJ2Gzr3CAWIBuSkA';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);