/* Ortak FN cüzdanı (banka + market AYNI dosya). Aynı alan adındaki (ör. *.github.io) iki site localStorage'ı paylaşır:
   market'te satın alınan tasarım bankanın editöründe hemen açılır. Gerçek sunucu bağlıyken (NEXUS_URL / API_BASE dolu)
   bakiye ve sahiplik SUNUCUDAN gelir; buradaki kayıt yalnızca demo ve önbellektir, güvenilir değildir. */
(function (root) {
  'use strict';
  var KEY = 'fnx.wallet.v1', START = 12450;
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v.balance === 'number') return v; } catch (e) {}
    return { balance: START, ledger: [], owned: [], equipped: '', idem: {} };
  }
  function save(w) { try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) {} return w; }
  var W = {
    get: load,
    balance: function () { return load().balance; },
    owns: function (id) { return load().owned.indexOf(id) >= 0; },
    equipped: function () { var w = load(); return w.equipped && w.owned.indexOf(w.equipped) >= 0 ? w.equipped : ''; },
    equip: function (id) { var w = load(); if (id && w.owned.indexOf(id) < 0) return false; w.equipped = id || ''; save(w); return true; },
    ledger: function () { return load().ledger.slice().reverse(); },
    // Sunucu sahiplik listesi verdiyse (ör. payload.owned_skins) birleştirir.
    mergeOwned: function (list) { if (!Array.isArray(list)) return; var w = load(); list.forEach(function (t) { if (typeof t === 'string' && w.owned.indexOf(t) < 0) w.owned.push(t); }); save(w); },
    // Atomik satın alma: bakiye düşer + hareket yazılır + tasarım teslim edilir. Aynı idemKey ikinci kez ücret almaz.
    buy: function (o) {
      var w = load();
      if (w.idem[o.key]) return w.idem[o.key];
      if (o.grant && w.owned.indexOf(o.grant) >= 0) { var e = new Error('Bu tasarım zaten sende.'); e.code = 'ALREADY_OWNED'; throw e; }
      if (w.balance < o.price) { var e2 = new Error('Yetersiz bakiye. ' + (o.price - w.balance) + ' FN daha gerekli.'); e2.code = 'INSUFFICIENT_BALANCE'; throw e2; }
      w.balance -= o.price;
      if (o.grant) { w.owned.push(o.grant); if (!w.equipped) w.equipped = o.grant; }
      var tx = 'tx_' + Math.random().toString(36).slice(2, 10);
      w.ledger.push({ id: tx, at: Date.now(), type: 'Purchase', product_id: o.product, name: o.name, amount: -o.price, balance_after: w.balance });
      var res = { transaction_id: tx, balance: w.balance }; w.idem[o.key] = res; save(w); return res;
    },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
  root.FNXWallet = W;
})(window);
