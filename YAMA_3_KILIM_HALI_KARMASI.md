# Yama 3 — Kilim & Halı Karması (+50 kart) ve "Halı & Kilim" kategorisi

ÖNCE "Halı Paketi II" yaması (0013, nx280_341-370) uygulanmış olmalı. Bu zip onun üzerine biner; çakışan dosyaların (skins.js ×4, 0007, katalog, test, audit) yeni hâli içerir.

## Yeni kartlar (nx280_371 … 420) — "Anatolian Kilim & Carpet Mix" (16. koleksiyon)
- 24 kilim (düz dokuma): 12 Şeritli, 6 Sütunlu, 6 Halkalı Baklava
- 26 halı (havlı): 10 Madalyonlu, 6 Seccade, 10 Dolu Zeminli
- Her kart farklı motif üçlüsü + renk paleti. İsimler tür adı içerir ("Şeritli Kilim — …", "Seccade Halı — …") → aramada bulunur.
- 550.000 FN, stok 2, kişi başı 1, "rare" (mevcut halılarla aynı). 167 dikey / 193 yatay (toplam 360).

## Kategori / bulunabilirlik (Market)
- Keşfet'te yeni üst kategori çipi: "Halı & Kilim" (tüm halı koleksiyonları: 110 kart) + ana sayfada ilk tile.
- Yeni koleksiyon çipleri: "Anatolian Geometries II", "Kilim & Halı Karması".
- Halı kartları artık "Nexus Collectible 341" yerine kendi adıyla görünür (diğer koleksiyonlar aynen kalır).
- Arama Türkçe karakterden bağımsız: "hali", "seccade", "kilim" bulur.
- "14 ORIGINAL WORLDS" ve "280 ürünü keşfet" metinleri sayıdan dinamik; index.html sürüm parametresi v6 (önbellek yenilenir).
- Demo kataloğu (data/products.json) 430 ürüne çıktı (halı paketleri dahil).

## Kurulum
1. Dosyaları aynı yollarla kopyalayın (art-source ve PNG'ler repoya girmez).
2. `npm test` (90/90), `npm run audit:sync`, `node scripts/audit-280-catalog.mjs` temiz çıkmalı.
3. Canlıya: 0013 + 0014 migration'ları (`INSERT OR IGNORE`, tekrar çalıştırılabilir).

## Dikkat
- Motif adları/anlamları doğrulanmadı (research_note'ta yazılı); kartlarda anlam/yöre iddiası yok.
- Kilim/halı ayrımı bana ait: Madalyonlu, Seccade, Dolu Zeminli = halı; diğerleri kilim.
- Görseller prosedürel; assets/collectibles bu 80 kart için üretilmedi.
- Mock/demo modda "2 / undefined kaldı" yazısı eski bir demo veri eksiği (gerçek API'de stok gelir); bu yamayla ilgili değil.
