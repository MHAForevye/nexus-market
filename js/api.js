// API katmanı: UI yalnızca window.API fonksiyonlarını çağırır.
// MOCK mod backend kurallarını (atomik satın alma, idempotency, tek sahiplik, süreli etkinlik) taklit eder.
// Gerçek modda aynı fonksiyonlar docs/API.md'deki endpoint'lere gider. Güvenilir kaynak her zaman sunucudur.
(function () {
  const C = window.NEXUS_CONFIG, KEY = "nexus_market_state_v1";
  let seed = null, timeOffset = 0;
  const serverNow = () => Date.now() + timeOffset;
  const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 10);
  const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
  const fail = (code, message) => { const e = new Error(message); e.code = code; throw e; };

  async function loadSeed() {
    if (seed) return seed;
    seed = await (await fetch("data/products.json")).json();
    const t0 = Date.now();
    seed.events.forEach((e) => { e.starts_at = t0 + e.startsH * 36e5; e.ends_at = t0 + e.endsH * 36e5; });
    return seed;
  }
  const load = () => JSON.parse(localStorage.getItem(KEY) || "null") ||
    { balance: 2500, ent: {}, wish: [], ledger: [], idem: {}, progress: {}, claims: {}, used: {} };
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  const evStatus = (e) => e.cancelled ? "cancelled" : serverNow() < e.starts_at ? "upcoming" : serverNow() > e.ends_at ? "ended" : "active";

  function view(p, s) {
    const owned = s.ent[p.id], left = p.inventory.policy === "limited" ? p.inventory.total - (s.used[p.id] || 0) : null;
    return { ...p, owned_qty: owned ? owned.qty : 0, stock_left: left };
  }
  function grant(s, pid, qty, source, tx) {
    const p = seed.products.find((x) => x.id === pid);
    if (p.type === "bundle") { p.items.forEach((i) => { const q = seed.products.find((x) => x.id === i); if (!(q.type === "permanent" && s.ent[i])) grant(s, i, 1, source, tx); }); return; }
    if (p.type === "permanent" && s.ent[pid]) fail("ALREADY_OWNED", "Bu ürün zaten sende.");
    const cur = s.ent[pid];
    s.ent[pid] = cur ? { ...cur, qty: cur.qty + qty } : { qty, acquired_at: serverNow(), source, transaction_id: tx };
  }
  const mock = {
    async catalog() { await wait(); const d = await loadSeed(); return { categories: d.categories, events: d.events.map((e) => ({ ...e, status: evStatus(e) })) }; },
    async products() { await wait(); const d = await loadSeed(), s = load(); return d.products.filter((p) => p.status === "published").map((p) => view(p, s)); },
    async product(id) { return (await this.products()).find((p) => p.id === id) || fail("NOT_FOUND", "Ürün bulunamadı."); },
    async me() { await loadSeed(); const s = load(); return { balance: s.balance, entitlements: s.ent, wishlist: s.wish }; },
    async ledger() { await wait(150); return load().ledger.slice().reverse(); },
    async wishlistToggle(id) {
      await loadSeed(); const s = load(), p = seed.products.find((x) => x.id === id);
      if (s.wish.includes(id)) s.wish = s.wish.filter((x) => x !== id);
      else { if (p.type === "permanent" && s.ent[id]) fail("ALREADY_OWNED", "Bu ürüne zaten sahipsin; istek listesine eklenemez."); s.wish.push(id); }
      save(s); return s.wish;
    },
    async purchase(id, key) {
      await wait(450); await loadSeed(); const s = load();
      if (s.idem[key]) return s.idem[key];
      const p = seed.products.find((x) => x.id === id);
      if (!p || p.status !== "published") fail("UNAVAILABLE", "Ürün şu an satışta değil.");
      if (!p.acq.includes("Purchase")) fail("NOT_PURCHASABLE", "Bu ürün satın alınamaz; ödül veya etkinlikle kazanılır.");
      if (p.type === "permanent" && s.ent[id]) fail("ALREADY_OWNED", "Bu ürün zaten sende.");
      if (p.type === "bundle" && p.items.every((i) => seed.products.find((x) => x.id === i).type === "permanent" && s.ent[i])) fail("ALREADY_OWNED", "Paketteki tüm ürünlere zaten sahipsin.");
      if (p.inventory.policy === "limited" && (s.used[id] || 0) >= p.inventory.total) fail("SOLD_OUT", "Stok tükendi.");
      if (s.balance < p.price) fail("INSUFFICIENT_BALANCE", `Yetersiz bakiye. ${p.price - s.balance} ${C.CURRENCY} daha gerekli.`);
      const tx = uid("tx");
      grant(s, id, 1, "Purchase", tx);
      s.balance -= p.price; s.used[id] = (s.used[id] || 0) + 1;
      s.ledger.push({ id: tx, at: serverNow(), type: "Purchase", product_id: id, name: p.name, amount: -p.price, balance_after: s.balance });
      const res = { transaction_id: tx, balance: s.balance }; s.idem[key] = res; save(s); return res;
    },
    async rewards() {
      await wait(); const d = await loadSeed(), s = load();
      return d.rewards.map((r) => {
        const ev = r.eventId && d.events.find((e) => e.id === r.eventId), st = ev ? evStatus(ev) : "active";
        return { ...r, progress: s.progress[r.id] || 0, claimed: !!s.claims[r.id], window: st, product: d.products.find((p) => p.id === r.productId) };
      });
    },
    async advance(id) { const s = load(); s.progress[id] = (s.progress[id] || 0) + 1; save(s); },
    async claim(id) {
      await wait(350); await loadSeed(); const s = load(), r = seed.rewards.find((x) => x.id === id);
      const ev = r.eventId && seed.events.find((e) => e.id === r.eventId);
      if (s.claims[id]) fail("ALREADY_CLAIMED", "Bu ödülü zaten aldın.");
      if (ev && evStatus(ev) !== "active") fail("EVENT_NOT_ACTIVE", "Etkinlik aktif değil.");
      if ((s.progress[id] || 0) < r.goal) fail("CONDITION_NOT_MET", "Ödül koşulu henüz tamamlanmadı.");
      const p = seed.products.find((x) => x.id === r.productId); if (p.type === "permanent" && s.ent[p.id]) fail("ALREADY_OWNED", "Bu ürüne zaten sahipsin.");
      const tx = uid("rw"); grant(s, p.id, r.qty || 1, r.eventId ? "Event" : "Reward", tx); s.claims[id] = tx;
      s.ledger.push({ id: tx, at: serverNow(), type: r.eventId ? "Event" : "Reward", product_id: p.id, name: p.name, amount: 0, balance_after: s.balance });
      save(s); return { transaction_id: tx };
    },
    async consume(id, key) {
      await wait(300); const s = load(); if (s.idem[key]) return s.idem[key];
      const e = s.ent[id]; if (!e || e.qty < 1) fail("NO_STOCK", "Kullanılacak adet yok.");
      e.qty -= 1; const res = { remaining: e.qty }; s.idem[key] = res; save(s); return res;
    },
    async reset() { localStorage.removeItem(KEY); }
  };

  async function req(method, path, body, key) {
    const h = { "Content-Type": "application/json" }, tok = localStorage.getItem(C.AUTH_TOKEN_KEY);
    if (tok) h.Authorization = "Bearer " + tok; if (key) h["Idempotency-Key"] = key;
    const r = await fetch(C.API_BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    const date = r.headers.get("Date"); if (date) timeOffset = new Date(date).getTime() - Date.now();
    const j = await r.json().catch(() => ({})); if (!r.ok) fail(j.code || "ERROR", j.message || "İşlem tamamlanamadı.");
    return j;
  }
  const real = {
    catalog: () => req("GET", "/catalog"), products: () => req("GET", "/products"), product: (id) => req("GET", "/products/" + id),
    me: () => req("GET", "/me"), ledger: () => req("GET", "/me/ledger"), wishlistToggle: (id) => req("POST", "/me/wishlist/" + id + "/toggle"),
    purchase: (id, k) => req("POST", "/products/" + id + "/purchase", {}, k), rewards: () => req("GET", "/rewards"),
    claim: (id) => req("POST", "/rewards/" + id + "/claim"), consume: (id, k) => req("POST", "/me/entitlements/" + id + "/consume", {}, k),
    advance: async () => {}, reset: async () => {}
  };
  window.API = { ...(C.API_BASE ? real : mock), mode: C.API_BASE ? "real" : "mock", serverNow, uid, evStatus };
})();
