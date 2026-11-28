(function (root) {
  'use strict';
  var A = root.__FNXA;
  A.collect = function (item, w, h, P) {
    var num = parseInt(String(item.id).slice(-3), 10), C = A.newCtx(item, w, h, P + 'a' + num + '_');
    if (A.MAT[num]) A.MAT[num](C);
    else if (num >= 311 && num <= 370) A.rug(C, num);
    else if (num >= 371 && num <= 420) A.rug2(C, num);
    else if (A.CLUBS[num]) A.club(C, num);
    else A.chars(C, num);
    var isRug = num >= 311 && num <= 420;
    // okunabilirlik için çok hafif üst/alt karartma (halıda yok: düz ışık kuralı)
    if (!isRug) C.body.push('<rect width="' + w + '" height="' + h + '" fill="' + A.LG(C, [[0, '#000', .34], [.22, '#000', 0], [.7, '#000', 0], [1, '#000', .3]], 0, 0, 0, 1) + '"/>');
    return { defs: C.defs.join(''), under: C.body.join('') };
  };
})(typeof window !== 'undefined' ? window : globalThis);
