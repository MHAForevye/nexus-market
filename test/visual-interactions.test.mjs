import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
const catalog = JSON.parse(await readFile(new URL('../../forevye-nexus-main/docs/catalog-280/CATALOG_280.json', import.meta.url), 'utf8'));
const productData = JSON.parse(await readFile(new URL('../data/products.json', import.meta.url), 'utf8')).products;

test('NEXUS 280 ürün adları ve açıklamaları hak güvenli özgün etiketlerle sunulur', () => {
  const items = catalog.items;
  assert.equal(items.length, 280);
  assert.match(app, /const productTitle = \(p\) => is280\(p\) \? `Nexus Collectible/);
  assert.match(app, /const productDescription = \(p\) => is280\(p\)/);
  assert.match(app, /const ORIGINAL_COLLECTION_NAMES =/);
  assert.match(app, /ORIGINAL_COLLECTION_NAMES\[c\.id\] \|\| c\.name/);
});

test('ürün detayında erişilebilir ön/arka yüz çevirme kontrolü var', () => {
  assert.match(app, /class="nx-flip-stage rarity-\$\{rarityClass\(p\)\}" data-flipped="false"/);
  assert.match(app, /data-flip aria-pressed="false"/);
  assert.match(app, /Ön yüze dön/);
  assert.match(css, /\.nx-flip-stage\[data-flipped="true"\] \.nx-flip-inner\{transform:rotateY\(180deg\)\}/);
});

test('masaüstü tilt ve parlama hareketi azaltılmış hareket ayarına saygı duyar', () => {
  assert.match(app, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(app, /prefers-reduced-motion/);
  assert.match(css, /\.card\.nx-tilting/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});


test('280 kartın tamamı kendi benzersiz skin kimliğine ve SVG sanat üreticisine bağlı', async () => {
  const skins = await readFile(new URL('../js/card/skins.js', import.meta.url), 'utf8');
  const ids = catalog.items.map((x) => x.id);
  assert.equal(ids.length, 280);
  assert.equal(new Set(ids).size, 280);
  assert.match(skins, /var COLLECTION_280 =/);
  assert.match(skins, /function gallerySkin/);
  assert.match(app, /data-card-id=/);
});

test('nadirlik efektleri, efsanevi açılış sahnesi ve mitik holografik katman hazır', () => {
  assert.match(app, /data-reveal=\"legendary\"/);
  assert.match(app, /nx-reveal-scene/);
  assert.match(app, /rarity-\$\{rarityClass\(p\)\}/);
  assert.match(css, /nx-mythic-foil/);
  assert.match(css, /nx-reveal-arrive/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('koleksiyon galerisi 280 kartı ve seri bazlı tamamlama oranını gösterir', () => {
  assert.match(app, /THE 280 MASTER GALLERY/);
  assert.match(app, /owned280.length \/ all.length/);
  assert.match(app, /nx-progress-row/);
  assert.match(app, /nx-gallery-grid/);
  assert.match(css, /\.nx-gallery-grid/);
});


test('280 ayrı SVG sanat dosyası diskte mevcut ve her biri farklı', async () => {
  const files = (await readdir(new URL('../assets/cards/', import.meta.url))).filter((x) => x.endsWith('.svg'));
  assert.equal(files.length, 280);
  const sample = await Promise.all(files.map((f) => readFile(new URL('../assets/cards/' + f, import.meta.url), 'utf8')));
  assert.equal(new Set(sample).size, 280);
  assert.ok(sample.every((svg) => svg.startsWith('<svg') && svg.includes('</svg>')));
  assert.match(app, /src=\"assets\/cards\/\$\{esc\(p\.id\)\}\.svg\"/);
});


test('SVG sanat eserlerinde nötr FOREVYE koleksiyon etiketleri kullanılır', async () => {
  const products = productData.filter((p) => /^nx(?:250|280)_\d{3}$/.test(p.id));
  assert.equal(products.length, 280);
  for (const p of products) {
    const svg = await readFile(new URL('../assets/cards/' + p.id + '.svg', import.meta.url), 'utf8');
    const title = svg.match(/<text x="[^"]+" y="[^"]+" text-anchor="end"[^>]*>([^<]+)<\/text>/);
    assert.equal(title?.[1], 'NEXUS COLLECTIBLE ' + p.id.slice(-3));
  }
});
