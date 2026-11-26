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
  // Bakiye ve kart yüzeyi sahipliği bankayla ORTAK cüzdandan gelir (js/card/wallet.js, aynı alan adında localStorage paylaşılır).
  const WL = window.FNXWallet;
  const load = () => {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") || { balance: 0, ent: {}, wish: [], ledger: [], idem: {}, progress: {}, claims: {}, used: {} };
    s.balance = WL.balance();
    if (seed) seed.products.forEach((p) => { if (p.skin && WL.owns(p.skin) && !s.ent[p.id]) s.ent[p.id] = { qty: 1, acquired_at: serverNow(), source: "Purchase", transaction_id: "wallet" }; });
    return s;
  };
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
    async bankReturn() { return req("POST", "/bank-ticket", {}); },
    async catalog() { await wait(); const d = await loadSeed(); return { categories: d.categories, events: d.events.map((e) => ({ ...e, status: evStatus(e) })) }; },
    async products() { await wait(); const d = await loadSeed(), s = load(); return d.products.filter((p) => p.status === "published").map((p) => view(p, s)); },
    async product(id) { return (await this.products()).find((p) => p.id === id) || fail("NOT_FOUND", "Ürün bulunamadı."); },
    async me() { await loadSeed(); const s = load(); return { balance: s.balance, entitlements: s.ent, wishlist: s.wish }; },
    async ledger() { await wait(150); return load().ledger.slice().reverse(); },
    async communityListings() { await wait(120); return { items: [], commission_pct: 30 }; },
    async communityMine() { await wait(120); return { listings: [], cards: [], commission_pct: 30 }; },
    async communityList() { fail('UNSUPPORTED', 'Topluluk pazarı için gerçek Nexus API bağlantısı gerekir.'); },
    async communityBuy() { fail('UNSUPPORTED', 'Topluluk pazarı için gerçek Nexus API bağlantısı gerekir.'); },
    async communityCancel() { fail('UNSUPPORTED', 'Topluluk pazarı için gerçek Nexus API bağlantısı gerekir.'); },
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
      // Ortak cüzdan: bakiye düşümü + hareket + (kart yüzeyiyse) bankaya teslim TEK işlemde.
      let w; try { w = WL.buy({ key, price: p.price, name: p.name, product: id, grant: p.skin || null }); } catch (e) { fail(e.code || "ERROR", e.message); }
      const tx = w.transaction_id;
      grant(s, id, 1, "Purchase", tx);
      s.balance = w.balance; s.used[id] = (s.used[id] || 0) + 1;
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
    async reset() { localStorage.removeItem(KEY); WL.reset(); }
  };

  const SESSION_KEY = "nexus_market_session_v1";
  const apiBase = String(C.API_BASE || "").replace(/\/+$/, "");
  let token = "", deepProductId = "";
  const getToken = () => { try { return sessionStorage.getItem(SESSION_KEY) || ""; } catch (_) { return ""; } };
  const setToken = (v) => { token = v || ""; try { if (token) sessionStorage.setItem(SESSION_KEY, token); else sessionStorage.removeItem(SESSION_KEY); } catch (_) {} };

  async function req(method, path, body, allowNoToken) {
    const h = { "Content-Type": "application/json" };
    if (!allowNoToken && token) h.Authorization = "Bearer " + token;
    const controller = new AbortController();
    const timeoutMs = Number(C.REQUEST_TIMEOUT_MS) > 0 ? Number(C.REQUEST_TIMEOUT_MS) : 12000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let r;
    try {
      r = await fetch(apiBase + path, {
        method, headers: h,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: "omit", cache: "no-store", signal: controller.signal
      });
    } catch (err) {
      if (controller.signal.aborted) fail("TIMEOUT", `Market sunucusu ${Math.round(timeoutMs / 1000)} saniye içinde yanıt vermedi (${path}). Yeniden deneyin.`);
      fail("NETWORK_ERROR", `Market sunucusuna ulaşılamadı (${path}). İnternet, Worker adresi ve CORS ayarını kontrol edin.`);
    } finally { clearTimeout(timer); }
    const date = r.headers.get("Date"); if (date) timeOffset = new Date(date).getTime() - Date.now();
    const raw = await r.text();
    let j = {}; try { j = raw ? JSON.parse(raw) : {}; } catch (_) { j = { raw_response: raw.slice(0, 300) }; }
    if (!r.ok) {
      const e = j.error || j;
      const detail = e.message || j.message || (j.raw_response ? `Sunucu JSON olmayan yanıt verdi: ${j.raw_response}` : `Market sunucusu ${r.status} yanıtı verdi.`);
      fail(e.code || j.code || `HTTP_${r.status}`, `${detail} [${method} ${path}]`);
    }
    if (j && j.error && j.error.message) fail(j.error.code || 'API_ERROR', `${j.error.message} [${method} ${path}]`);
    return j;
  }
  const formatProduct = (p) => ({
    id: p.id, type: "permanent", cat: p.collection_id || (p.kind === "function" ? "functions" : "designs"), collection: p.collection || null, collection_type: p.collection_type || null, orientation: p.orientation || "landscape", art_direction: p.art_direction || "", asset_status: p.asset_status || "",
    name: p.name, tagline: p.tagline, desc: p.desc || "", price: Number(p.price || 0) / 100, price_minor: Number(p.price || 0),
    skin: p.skin || null, rarity: p.rarity, isNew: !!p.is_new, acq: ["Purchase"],
    stock_left: p.stock_left == null ? null : Number(p.stock_left), stock_total: p.stock_total == null ? null : Number(p.stock_total),
    inventory: { policy: p.stock_total == null ? "unlimited" : "limited", total: p.stock_total == null ? null : Number(p.stock_total) },
    usage: p.perks ? Object.entries(p.perks).map(([k,v]) => k + ": " + v).join(" · ") : (p.skin ? "Kart editöründe kullanılır; satın alındıktan sonra kalıcıdır." : "Hesap avantajı sağlar."),
    perks: p.perks || null, max_qty: p.max_qty || 1
  });
  function entitlementMap(rows) {
    const out = {};
    (Array.isArray(rows) ? rows : []).forEach(e => { out[e.product_id] = { qty: e.qty, acquired_at: e.acquired_at, source: "Purchase", transaction_id: e.tx_ref, serial: e.serial }; });
    return out;
  }
  const real = {
    async boot() {
      deepProductId = new URLSearchParams(location.search).get("product_id") || "";
      const ticketMatch = /(?:^|[#&])t=([A-Za-z0-9_-]{20,80})/.exec(location.hash || "");
      const ticket = ticketMatch && ticketMatch[1];
      if (ticket) {
        history.replaceState(null, "", location.pathname + (deepProductId ? "?product_id=" + encodeURIComponent(deepProductId) : ""));
        const r = await req("POST", "/exchange", { ticket }, true);
        if (!r.token) fail("INVALID_TICKET", "Nexus Market bileti geçersiz.");
        setToken(r.token);
      } else setToken(getToken());
      if (!token) return { authenticated: false, productId: deepProductId };
      try { await req("GET", "/me"); }
      catch (e) { if (e.code === "shop_token" || e.code === "UNAUTHORIZED") { setToken(""); return { authenticated: false, productId: deepProductId }; } throw e; }
      return { authenticated: true, productId: deepProductId };
    },
    async bankReturn() { return req("POST", "/bank-ticket", {}); },
    async catalog() { const cats = new Map(); (window.FNXSkins?.catalog || []).forEach(x => { if (x.collection && x.collectionId) cats.set(x.collectionId, x.collection); }); return { categories: [...Array.from(cats, ([id,name]) => ({id,name})), { id: "designs", name: "Diğer kart tasarımları" }, { id: "functions", name: "Fonksiyonel kartlar" }], events: [] }; },
    async products() { const r = await req("GET", "/products"); return (r.products || []).map(formatProduct); },
    async product(id) { const r = await req("GET", "/product?id=" + encodeURIComponent(id)); return r.product ? formatProduct(r.product) : fail("NOT_FOUND", "Ürün bulunamadı."); },
    async me() { const r = await req("GET", "/me"); return { balance: Number(r.balance || 0) / 100, entitlements: entitlementMap(r.entitlements), wishlist: r.wishlist || [], user: r.user, perks: r.perks, limits: r.limits, cards: r.cards || [] }; },
    async ledger() { const r = await req("GET", "/purchases?page=0&size=30"); return (r.items || []).map(x => ({ id: x.id, at: x.at, type: "Purchase", product_id: x.product_id, name: x.name, amount: -Number(x.price || 0) / 100, balance_after: null, serial: x.serial, status: x.status })); },
    async wishlistToggle(id) { const r = await req("POST", "/wishlist", { pid: id }); return r.wishlist || []; },
    async purchase(id, key, cardId = null) {
      const r = await req("POST", "/purchase", { pid: id, idem: key, ...(cardId ? { card_id: cardId } : {}) });
      if (r.ok === false) {
        const messages = { sold_out: ["SOLD_OUT", "Bu tasarımın sınırlı stoğu tükendi."], insufficient: ["INSUFFICIENT_BALANCE", "Ana cüzdanındaki FN bakiyesi yetersiz."], insufficient_card: ["INSUFFICIENT_CARD_BALANCE", "Seçtiğin kartın bakiyesi yetersiz. Önce karta FN yükle."], card_disabled: ["CARD_DISABLED", "Devre dışı kartla ödeme yapılamaz."], already_owned: ["ALREADY_OWNED", "Bu ürüne zaten sahipsin."], unavailable: ["UNAVAILABLE", "Ürün şu anda satışta değil."] };
        const m = messages[r.code] || [String(r.code || "ERROR").toUpperCase(), "Satın alma tamamlanamadı."];
        fail(m[0], m[1]);
      }
      return { transaction_id: r.purchase && r.purchase.id, balance: Number(r.balance || 0) / 100, purchase: r.purchase, entitlement: r.entitlement, delivery: r.delivery || null, payment: r.payment || { method: 'wallet' } };
    },
    async communityListings() { return req('GET', '/community'); },
    async communityMine() { return req('GET', '/community/mine'); },
    async communityList(card_id, title, description, price) { return req('POST', '/community/list', { card_id, title, description, price }); },
    async communityBuy(id, idem) { return req('POST', '/community/' + encodeURIComponent(id) + '/buy', { idem }); },
    async communityCancel(id) { return req('POST', '/community/' + encodeURIComponent(id) + '/cancel', {}); },
    async rewards() { return []; },
    async advance() { fail("UNSUPPORTED", "Görev ilerlemesi bu mağaza sürümünde etkin değil."); },
    async claim() { fail("UNSUPPORTED", "Ödül kazanımı bu mağaza sürümünde etkin değil."); },
    async consume() { fail("UNSUPPORTED", "Bu ürün tüketilebilir değil."); },
    async reset() { setToken(""); },
    get deepProductId() { return deepProductId; }
  };
  window.API = { ...(C.API_BASE ? real : mock), mode: C.API_BASE ? "real" : "mock", serverNow, uid, evStatus, boot: C.API_BASE ? real.boot : async () => ({ authenticated: true }) };
})();
