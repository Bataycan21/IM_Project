// ================================================================
//  supabase.js — StockPilot Supabase REST Client (zero CDN)
//  Pure fetch() against Supabase PostgREST API.
//  Works on Vercel, GitHub Pages, any static host — no npm needed.
// ================================================================

const SUPABASE_URL  = 'https://vgprkfxmeioxevtocenp.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncHJrZnhtZWlveGV2dG9jZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzM3NjMsImV4cCI6MjA4NzY0OTc2M30.KoPJ4JXgPtZ13OHAwYVukfyWQykWJ2Gzr3CAWIBuSkA';

const db = (() => {

  const BASE_HEADERS = {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_ANON,
    'Authorization': `Bearer ${SUPABASE_ANON}`,
  };

  class Query {
    constructor(table) {
      this._table   = table;
      this._select  = '*';
      this._filters = [];
      this._orderCol = null;
      this._orderAsc = true;
      this._limitVal = null;
      this._method  = 'GET';
      this._body    = null;
      this._countMode = null;
      this._headOnly  = false;
    }

    select(cols = '*', opts = {}) {
      this._select    = cols;
      this._countMode = opts.count || null;
      this._headOnly  = opts.head  || false;
      this._method    = 'GET';
      return this;
    }

    insert(data) {
      this._method = 'POST';
      this._body   = JSON.stringify(Array.isArray(data) ? data : [data]);
      return this;
    }

    update(data) {
      this._method = 'PATCH';
      this._body   = JSON.stringify(data);
      return this;
    }

    delete() {
      this._method = 'DELETE';
      return this;
    }

    eq(col, val)  { this._filters.push([col, `eq.${val}`]);  return this; }
    neq(col, val) { this._filters.push([col, `neq.${val}`]); return this; }
    gt(col, val)  { this._filters.push([col, `gt.${val}`]);  return this; }
    gte(col, val) { this._filters.push([col, `gte.${val}`]); return this; }
    lt(col, val)  { this._filters.push([col, `lt.${val}`]);  return this; }
    lte(col, val) { this._filters.push([col, `lte.${val}`]); return this; }

    order(col, opts = {}) {
      this._orderCol = col;
      this._orderAsc = opts.ascending !== false;
      return this;
    }

    limit(n) { this._limitVal = n; return this; }

    // Make it awaitable
    then(resolve, reject) { return this._run().then(resolve, reject); }

    async _run() {
      const url = new URL(`${SUPABASE_URL}/rest/v1/${this._table}`);

      // select & joins (PostgREST handles nested resource embedding via select)
      url.searchParams.set('select', this._select);

      // filters — PostgREST uses ?col=op.value format
      this._filters.forEach(([col, val]) => url.searchParams.append(col, val));

      // order — PostgREST: ?order=col.asc or ?order=col.desc
      if (this._orderCol) {
        url.searchParams.set('order', `${this._orderCol}.${this._orderAsc ? 'asc' : 'desc'}`);
      }

      if (this._limitVal) url.searchParams.set('limit', this._limitVal);

      // Build headers
      const hdrs = { ...BASE_HEADERS };

      if (this._headOnly) {
        hdrs['Prefer'] = 'count=exact';
      } else if (this._countMode) {
        hdrs['Prefer'] = `count=${this._countMode}`;
      }

      if (this._method === 'POST' || this._method === 'PATCH') {
        hdrs['Prefer'] = 'return=representation';
      }

      try {
        const method = this._headOnly ? 'HEAD' : this._method;
        const res = await fetch(url.toString(), {
          method,
          headers: hdrs,
          body: this._body || undefined,
        });

        // Parse count from Content-Range header (e.g. "0-7/8")
        const cr    = res.headers.get('content-range');
        const count = cr ? parseInt(cr.split('/')[1]) : null;

        if (!res.ok) {
          let err = { message: res.statusText };
          try { err = await res.json(); } catch (_) {}
          return { data: null, count: null, error: err };
        }

        if (method === 'HEAD' || res.status === 204) {
          return { data: null, count, error: null };
        }

        const data = await res.json();
        return {
          data,
          count: count ?? (Array.isArray(data) ? data.length : 1),
          error: null,
        };
      } catch (err) {
        return { data: null, count: null, error: { message: err.message } };
      }
    }
  }

  return { from: (table) => new Query(table) };
})();