// A tiny in-memory stand-in for the parts of supabase-js the API uses.
// It is NOT a Postgres emulator: the SQL functions are tested separately against real Postgres.
export function createFakeSupabase(seed = {}, rpcs = {}) {
  const db = { Category: [], Product: [], Profile: [], Order: [], OrderItem: [], ...structuredClone(seed) };
  const calls = [];
  const uploads = [];

  function builder(table) {
    const state = { op: 'select', filters: [], orders: [], range: null, payload: null, embed: null, innerFilters: [] };

    const apply = (rows) => {
      let out = rows.filter((r) => state.filters.every((f) => f(r)));
      for (const [col, asc] of [...state.orders].reverse()) {
        out = [...out].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
      }
      return out;
    };
    const withEmbed = (rows) => {
      if (!state.embed) return rows;
      let result = rows.map((r) => ({ ...r, items: db.OrderItem.filter((i) => i.orderId === r.id && state.innerFilters.every((f) => f(i))) }));
      if (state.embed.inner) result = result.filter((r) => r.items.length);
      return result;
    };

    const run = () => {
      if (state.op === 'insert') {
        const row = { id: db[table].length + 1, created_at: new Date().toISOString(), ...state.payload };
        const dupKey = table === 'Profile' && db.Profile.some((p) => p.uid === row.uid);
        if (dupKey) return { data: null, error: { code: '23505', message: 'duplicate' } };
        db[table].push(row);
        return { data: [row], error: null };
      }
      if (state.op === 'update') {
        const rows = apply(db[table]);
        rows.forEach((r) => Object.assign(r, state.payload));
        return { data: rows, error: null };
      }
      if (state.op === 'delete') {
        const rows = apply(db[table]);
        db[table] = db[table].filter((r) => !rows.includes(r));
        return { data: rows, error: null };
      }
      const all = withEmbed(apply(db[table]));
      const data = state.range ? all.slice(state.range[0], state.range[1] + 1) : all;
      return { data, error: null, count: all.length };
    };

    const q = {
      select(cols) {
        if (cols && cols.includes('items:OrderItem')) state.embed = { inner: cols.includes('!inner') };
        return q;
      },
      insert(p) { state.op = 'insert'; state.payload = p; return q; },
      update(p) { state.op = 'update'; state.payload = p; return q; },
      delete() { state.op = 'delete'; return q; },
      eq(col, v) {
        if (col.startsWith('items.')) state.innerFilters.push((r) => r[col.slice(6)] === v);
        else state.filters.push((r) => String(r[col]) === String(v));
        return q;
      },
      in(col, vs) { state.filters.push((r) => vs.map(String).includes(String(r[col]))); return q; },
      gt(col, v) { state.filters.push((r) => r[col] > v); return q; },
      gte(col, v) { state.filters.push((r) => r[col] >= v); return q; },
      lte(col, v) { state.filters.push((r) => r[col] <= v); return q; },
      or(expr) {
        calls.push({ or: expr });
        const term = /\*(.+?)\*/.exec(expr)[1].toLowerCase();
        state.filters.push((r) => ['name', 'description', 'categoryName'].some((c) => String(r[c] ?? '').toLowerCase().includes(term)));
        return q;
      },
      order(col, o = {}) { state.orders.push([col, o.ascending !== false]); return q; },
      range(a, b) { state.range = [a, b]; return q; },
      maybeSingle() { const r = run(); return Promise.resolve({ ...r, data: r.data?.[0] ?? null }); },
      single() { const r = run(); return Promise.resolve({ ...r, data: r.data?.[0] ?? null }); },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    return q;
  }

  return {
    db,
    calls,
    uploads,
    storage: {
      from: (bucket) => ({
        list: async (prefix) => ({ data: uploads.filter((u) => u.path.startsWith(prefix + '/')).map((u) => ({ name: u.path.split('/').pop() })), error: null }),
        upload: async (path, body, opts) => { uploads.push({ bucket, path, bytes: body.length, opts }); return { data: { path }, error: null }; },
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.example/${bucket}/${path}` } }),
      }),
    },
    from: builder,
    rpc: async (name, args) => {
      calls.push({ rpc: name, args });
      return rpcs[name] ? rpcs[name](args, db) : { data: null, error: { message: 'no fake rpc' } };
    },
  };
}
