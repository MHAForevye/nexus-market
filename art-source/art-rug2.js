(function (root) {
  'use strict';
  /* Halı/Kilim karması: 6 kompozisyon tipi (şeritli, sütunlu, halkalı baklava = kilim; madalyonlu, seccade, dolu zeminli = halı). */
  var A = root.__FNXA, n1 = A.n1, lit = A.lit, R = A.R, BM = A.BM, GRAY = A.GRAY, turb = A.turb, FILT = A.FILT, seedOf = A.seedOf, MOT = A.RUGMOT;
  var WORD = { 'kırık beyaz': '#E4DCC6', 'beyaz': '#EFEBDD', 'krem': '#DCCBA3', 'fildişi': '#E6DABC', 'kemik': '#D6CAAE', 'koyu kırmızı': '#8A1D24', 'kırmızı': '#A82A2C', 'bordo': '#6A1730', 'lacivert': '#1B2A52', 'koyu mavi': '#1E3A6A', 'mavi': '#2E5E9E', 'indigo': '#1F2D68', 'siyah': '#1B1714', 'koyu kahve': '#3E2A1E', 'kiremit': '#A24E2E', 'hardal': '#C2962A', 'sarı': '#D2AE38', 'altın': '#B8964A', 'çam yeşili': '#2E5842', 'koyu yeşil': '#294833', 'yeşil': '#3B764C', 'pembe-kiremit': '#C07562' };
  function lum(h) { var c = A.h2r(h); return (c[0] * .3 + c[1] * .59 + c[2] * .11) / 255; }
  function mv(num, x, y) { var m = MOT[num]; if (!m || x < 0 || y < 0 || x > 10 || y > 10) return -1; var ch = m[y].charAt(x); return ch === '#' ? 1 : ch === '+' ? 2 : 0; }
  function sc(num, x, y, k) { return mv(num, Math.floor(x / k), Math.floor(y / k)); }
  function build(C, num) {
    var S = A.RUG2[num], pw = S.pal.map(function (w) { return WORD[w] || '#8A1D24'; }), ground = pw[0], main = pw[1], acc = pw[2];
    if (Math.abs(lum(ground) - lum(main)) < .22) { var t0 = main; main = acc; acc = t0; }
    if (Math.abs(lum(ground) - lum(main)) < .2) main = lum(ground) > .5 ? '#2a1c16' : '#E6DABC';
    var cream = '#DCCBA3', pile = !!S.pile, u = Math.round((pile ? 9 : 11) * C.s), N = 11, fr = Math.round(15 * C.s), top = fr, bot = C.h - fr;
    var cols = Math.floor(C.w / u), rows = Math.floor((bot - top) / u), ox = Math.round((C.w - cols * u) / 2);
    var thin = S.type === 'bands' || S.type === 'columns', t = thin ? 4 : 6, M = S.motifs, M0 = M[0], M1 = M[1] || M[0], M2 = M[2] || M[0];
    var x0 = t, y0 = t, x1 = cols - t - 1, y1 = rows - t - 1, fw = x1 - x0 + 1, fh = y1 - y0 + 1, cxf = (fw - 1) / 2, cyf = (fh - 1) / 2, bs = S.bstyle || 0;
    function col(v, g, m, a) { return v === 1 ? m : v === 2 ? a : g; }
    function border(x, y) {
      var d = Math.min(x, y, cols - 1 - x, rows - 1 - y), q = (y < t || y >= rows - t) ? x : y;
      if (d === 0) return cream; if (d === 1) return main;
      if (thin) { if (d === 2) return ground; if (d === 3) return acc; return null; }
      if (d >= 2 && d <= 4) { var tt = d - 2; if (bs === 0) return Math.abs((q % 6) - 3) <= (2 - tt) ? main : ground; if (bs === 1) return ((Math.floor(q / 2) + tt) % 2) ? main : ground; if (bs === 2) return (Math.abs((q % 8) - 4) === tt + 1 || (q % 8) === 4 - 0 && tt === 1) ? acc : ground; return ((q + tt * 2) % 6 < 2) ? acc : ground; }
      if (d === 5) return acc; return null;
    }
    var cell = function (x, y) {
      var b = border(x, y); if (b) return b;
      var fx = x - x0, fy = y - y0, v = 0, g = ground, m = main, a = acc;
      if (S.type === 'bands') {
        var bh = 14, bi = Math.floor(fy / bh), ly = fy % bh; if (bi * bh + bh > fh + 6 && bi > 0 && fy >= fh - 2) return ground;
        if (bi % 2) { g = main; m = ground; }
        var mo = M[bi % M.length];
        if (ly === 0) return acc; if (ly === 13) return acc; var gy = ly - 1, off = (bi % 2) ? 6 : 0, gx = (fx + off) % 13;
        if (gy < 11 && gx < 11) v = mv(mo, gx, gy); return col(v, g, m, a);
      }
      if (S.type === 'columns') {
        var bw = 14, ci = Math.floor(fx / bw), lx = fx % bw; if (ci % 2) { g = main; m = ground; }
        if (lx === 0 || lx === 13) return acc; var gx2 = lx - 1, gy2 = (fy + ((ci % 2) ? 6 : 0)) % 13, mo2 = M[ci % M.length];
        if (gx2 < 11 && gy2 < 11) v = mv(mo2, gx2, gy2); return col(v, g, m, a);
      }
      if (S.type === 'concentric') {
        var dd = Math.abs(fx - cxf) + Math.abs(fy - cyf) * (fw / fh > 1.2 ? 1.4 : .85), ring = Math.floor(dd / 4), k = 2, mx = Math.round(cxf - 5.5 * k), my = Math.round(cyf - 5.5 * k);
        var ix = fx - mx, iy = fy - my;
        if (ix >= 0 && iy >= 0 && ix < 11 * k && iy < 11 * k) { var vv = sc(M0, ix, iy, k); return col(vv, ground, main, acc); }
        if (dd < 16) return [main, ground, acc][ring % 3] === acc && ring % 3 === 2 ? acc : (ring % 2 ? ground : main);
        var big = Math.floor(dd / 4); if (big < 8 + (S.extra || 0)) return big % 3 === 0 ? acc : big % 2 ? ground : main;
        var gx3 = (fx + ((Math.floor(fy / 13)) % 2 ? 6 : 0) + 1) % 13, gy3 = (fy + 1) % 13; if (gx3 < 11 && gy3 < 11) v = mv(M1, gx3, gy3); return col(v, ground, main, acc);
      }
      if (S.type === 'medallion') {
        var k2 = Math.max(1, Math.min(3, Math.floor((Math.min(fw, fh) - 6) / 11))), mx2 = Math.round(cxf - 5.5 * k2), my2 = Math.round(cyf - 5.5 * k2), ix2 = fx - mx2, iy2 = fy - my2, dm = Math.abs(fx - cxf) + Math.abs(fy - cyf);
        var R0 = 6.5 * k2 + 3;
        if (ix2 >= 0 && iy2 >= 0 && ix2 < 11 * k2 && iy2 < 11 * k2) { var v2 = sc(M0, ix2, iy2, k2); if (v2 > 0) return col(v2, ground, main, acc); }
        if (Math.abs(dm - R0) < .7) return acc; if (Math.abs(dm - R0 - 3) < .7) return main; if (dm < R0) return (dm < R0 - 1 && ((fx + fy) % 4 === 0)) ? acc : ground;
        // köşe spandrelleri
        var cx2 = fx < fw / 2 ? fx : fw - 1 - fx, cy2 = fy < fh / 2 ? fy : fh - 1 - fy;
        if (cx2 >= 2 && cy2 >= 2 && cx2 < 13 && cy2 < 13) { var vc = mv(M1, cx2 - 2, cy2 - 2); if (vc > 0) return col(vc, ground, main, acc); return (cx2 + cy2) % 2 ? ground : main; }
        var gx4 = (fx + ((Math.floor(fy / 13)) % 2 ? 6 : 0) + 1) % 13, gy4 = (fy + 1) % 13; if (gx4 < 11 && gy4 < 11 && dm > R0 + 6) v = mv(M2, gx4, gy4);
        return col(v, ground, main, acc);
      }
      if (S.type === 'prayer') {
        var halfW = Math.floor(fw * .36), ax = Math.abs(fx - cxf), shoulder = 3 + halfW, bottomY = fh - 8, inside = ax <= halfW && fy >= 2 + Math.floor(ax) && fy < bottomY;
        if (inside) {
          if (fy < shoulder + 2 && Math.abs(ax - (fy - 2)) < .9) return acc; // niş çizgisi
          if (ax === Math.floor(halfW)) return acc;
          var lampX = Math.round(cxf - 5), lampY = shoulder - 3 + 0; if (fx - lampX >= 0 && fx - lampX < 11 && fy - lampY >= 0 && fy - lampY < 11) { var vl = mv(348, fx - lampX, fy - lampY); if (vl > 0) return col(vl, main, ground, acc); }
          if (fy >= bottomY - 14) { var gx5 = (fx + 1) % 13, gy5 = fy - (bottomY - 13); if (gy5 >= 0 && gy5 < 11 && gx5 < 11) { var v5 = mv(M0, gx5, gy5); if (v5 > 0) return col(v5, main, ground, acc); } }
          return main;
        }
        if (fy >= bottomY && fy < bottomY + 2) return acc;
        var gx6 = (fx + ((Math.floor(fy / 13)) % 2 ? 6 : 0) + 1) % 13, gy6 = (fy + 1) % 13; if (gx6 < 11 && gy6 < 11) v = mv(M1, gx6, gy6); return col(v, ground, main, acc);
      }
      // allover
      var cell13 = 13, ci2 = Math.floor((fx + 1) / cell13), cj2 = Math.floor((fy + 1) / cell13), mo3 = ((ci2 + cj2) % 2) ? M1 : M0, gx7 = (fx + 1) % cell13, gy7 = (fy + 1) % cell13;
      if (gx7 < 11 && gy7 < 11) { v = mv(mo3, gx7, gy7); if (v > 0) return col(v, ground, main, acc); }
      if (((fx - fy) % 13 === 0) || ((fx + fy) % 13 === 0)) return acc;
      return ground;
    };
    var out = '', y, x, rr = A.rng(A.hash(C.item.id));
    out += '<rect x="0" y="' + top + '" width="' + C.w + '" height="' + (bot - top) + '" fill="' + cream + '"/>';
    for (y = 0; y < rows; y++) {
      var sh = (rr() - .5) * .09, run = null, xs = 0;
      for (x = 0; x <= cols; x++) { var cc = x < cols ? cell(x, y) : null; if (run !== cc) { if (run) out += '<rect x="' + (ox + xs * u) + '" y="' + (top + y * u) + '" width="' + ((x - xs) * u) + '" height="' + u + '" fill="' + lit(run, sh) + '"/>'; run = cc; xs = x; } }
      out += '<rect x="' + ox + '" y="' + (top + y * u + u - 1) + '" width="' + cols * u + '" height="1" fill="#000" fill-opacity=".16"/>';
    }
    var wf = FILT(C, turb('0.9 0.12', 3, seedOf(C)) + GRAY);
    var body = '<g' + (pile ? ' filter="' + FILT(C, turb('0.07', 2, seedOf(C)) + '<feDisplacementMap in="SourceGraphic" in2="n" scale="' + Math.round(3 * C.s) + '" xChannelSelector="R" yChannelSelector="G"/>') + '"' : '') + '>' + out + '</g>';
    C.body.push(R(C, '#2b211b')); C.body.push(body);
    C.body.push(R(C, '#808080', ' filter="' + wf + '"' + BM('overlay', pile ? .6 : .5)));
    if (pile) { var pf = FILT(C, turb('0.55', 3, seedOf(C)) + '<feDiffuseLighting in="n" surfaceScale="2.2" diffuseConstant="1" lighting-color="#fff"><feDistantLight azimuth="225" elevation="58"/></feDiffuseLighting>'); C.body.push(R(C, '#808080', ' filter="' + pf + '"' + BM('overlay', .65))); }
    var fz = '', tx; for (tx = 4 * C.s; tx < C.w; tx += 5 * C.s) { var jit = (rr() - .5) * 4 * C.s; fz += '<path d="M' + n1(tx) + ' ' + n1(top + 2) + 'Q' + n1(tx + jit) + ' ' + n1(top - fr * .5) + ' ' + n1(tx + jit * 1.6) + ' 0" fill="none" stroke="' + cream + '" stroke-width="' + n1(2.2 * C.s) + '" stroke-linecap="round"/><path d="M' + n1(tx) + ' ' + n1(bot - 2) + 'Q' + n1(tx - jit) + ' ' + n1(bot + fr * .5) + ' ' + n1(tx - jit * 1.6) + ' ' + C.h + '" fill="none" stroke="' + cream + '" stroke-width="' + n1(2.2 * C.s) + '" stroke-linecap="round"/>'; }
    C.body.push(fz);
    C.body.push(R(C, A.RG(C, [[0, '#fff', 0], [.75, '#000', 0], [1, '#000', .28]], .5, .5, .8)));
  }
  root.__FNXA.rug2 = build;
})(typeof window !== 'undefined' ? window : globalThis);
