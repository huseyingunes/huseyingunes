// GitHub profil kartları üreticisi
// Kullanım:  GH_TOKEN=... node scripts/olustur.mjs
//            node scripts/olustur.mjs --ornek   (çevrimdışı önizleme)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const CIKTI = join(KOK, 'kartlar');
const ayar = JSON.parse(await readFile(join(KOK, 'ayarlar.json'), 'utf8'));
const ORNEK = process.argv.includes('--ornek');
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

const W = 840;
const SANS = "'Segoe UI', Inter, Ubuntu, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'Cascadia Code', Consolas, 'SFMono-Regular', 'DejaVu Sans Mono', monospace";

// ───────────────────────── yardımcılar ─────────────────────────
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sayi = (n) => Number(n || 0).toLocaleString('tr-TR');

function genislik(metin, boyut, mono = false) {
  if (mono) return [...metin].length * boyut * 0.6;
  let t = 0;
  for (const c of metin) {
    if (c === ' ') t += 0.28;
    else if (/[A-ZÇĞİÖŞÜ]/.test(c)) t += 0.66;
    else if (/[0-9]/.test(c)) t += 0.56;
    else if (/[iıljtf.,·'|]/.test(c)) t += 0.3;
    else if (/[mw]/.test(c)) t += 0.82;
    else t += 0.53;
  }
  return t * boyut;
}

function sar(metin, enFazlaKarakter, satirSayisi) {
  const kelimeler = String(metin || '').split(/\s+/).filter(Boolean);
  const satirlar = [];
  let satir = '';
  for (const k of kelimeler) {
    const aday = satir ? `${satir} ${k}` : k;
    if ([...aday].length <= enFazlaKarakter) { satir = aday; continue; }
    if (satir) satirlar.push(satir);
    satir = [...k].length > enFazlaKarakter ? [...k].slice(0, enFazlaKarakter - 1).join('') + '…' : k;
  }
  if (satir) satirlar.push(satir);
  if (satirlar.length > satirSayisi) {
    const kes = satirlar.slice(0, satirSayisi);
    let son = kes[satirSayisi - 1];
    if ([...son].length > enFazlaKarakter - 1) son = [...son].slice(0, enFazlaKarakter - 1).join('');
    kes[satirSayisi - 1] = son.replace(/[\s,.;:]+$/, '') + '…';
    return kes;
  }
  return satirlar;
}

function once(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} dk önce`;
  if (s < 86400) return `${Math.round(s / 3600)} saat önce`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)} gün önce`;
  if (s < 86400 * 365) return `${Math.round(s / (86400 * 30))} ay önce`;
  return `${Math.round(s / (86400 * 365))} yıl önce`;
}

function sonrakiHedef(n) {
  const basamaklar = [1, 2.5, 5];
  for (let us = 1; us < 1e9; us *= 10) for (const b of basamaklar) if (b * us * 10 > n) return b * us * 10;
  return n * 2;
}

// ───────────────────────── ortak görünüm ─────────────────────────
function cerceve(h, govde, { lekeler = [[120, 40, '#1f6feb'], [620, 30, '#2ea043'], [480, h, '#8957e5']], ekStil = '', baslik = '' } = {}) {
  const lekeSvg = lekeler.map(([x, y, renk], i) => `
    <radialGradient id="leke${i}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${renk}" stop-opacity="0.38"/>
      <stop offset="1" stop-color="${renk}" stop-opacity="0"/>
    </radialGradient>`).join('');
  const lekeCiz = lekeler.map(([x, y], i) =>
    `<ellipse class="kay kay${i % 3}" cx="${x}" cy="${y}" rx="230" ry="${Math.min(150, h * 0.6)}" fill="url(#leke${i})"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(baslik)}">
  <title>${esc(baslik)}</title>
  <defs>
    ${lekeSvg}
    <clipPath id="dis"><rect x="1" y="1" width="${W - 2}" height="${h - 2}" rx="18"/></clipPath>
    <linearGradient id="kenar" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#58a6ff" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#3fb950" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#a371f7" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <style>
    .s{font-family:${SANS}}
    .m{font-family:${MONO}}
    .kay{animation:kay 14s ease-in-out infinite}
    .kay1{animation-duration:18s;animation-direction:reverse}
    .kay2{animation-duration:22s}
    @keyframes kay{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,12px)}}
    @keyframes belir{from{opacity:0}to{opacity:1}}
    @keyframes yanip{0%,49%{opacity:1}50%,100%{opacity:0}}
    @keyframes nabiz{0%,100%{opacity:1}50%{opacity:.35}}
    .imlec{animation:yanip 1.1s steps(1) infinite}
    .nabiz{animation:nabiz 2.4s ease-in-out infinite}
    ${ekStil}
  </style>
  <rect x="1" y="1" width="${W - 2}" height="${h - 2}" rx="18" fill="#0b0f15"/>
  <g clip-path="url(#dis)">${lekeCiz}</g>
  <rect x="1" y="1" width="${W - 2}" height="${h - 2}" rx="18" fill="none" stroke="url(#kenar)" stroke-width="1.2"/>
  <rect x="22" y="22" width="${W - 44}" height="${h - 44}" rx="14" fill="#0d1117" fill-opacity="0.55" stroke="#58a6ff" stroke-opacity="0.32"/>
  ${govde}
  <text class="s" x="${W - 18}" y="${h - 8}" text-anchor="end" font-size="9" fill="#6e7681">github.com/${esc(ayar.kullanici)}</text>
</svg>`;
}

function hap(x, y, metin, { mono = false, boyut = 12, yukseklik = 26 } = {}) {
  const w = genislik(metin, boyut, mono) + 30;
  return {
    w,
    svg: `<g>
      <rect x="${x}" y="${y}" width="${w}" height="${yukseklik}" rx="${yukseklik / 2}" fill="#161b22" fill-opacity="0.85" stroke="#58a6ff" stroke-opacity="0.45"/>
      <text class="${mono ? 'm' : 's'}" x="${x + w / 2}" y="${y + yukseklik / 2 + boyut * 0.36}" text-anchor="middle" font-size="${boyut}" font-weight="600" fill="#e6edf3">${esc(metin)}</text>
    </g>`,
  };
}

// ───────────────────────── 1. başlık kartı ─────────────────────────
function baslikKarti(v) {
  const h = 230;
  const cx = 104, cy = 100, r = 46;
  const avatar = v.avatar
    ? `<image href="${v.avatar}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#avatarKirp)" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#halka)"/><text class="s" x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="32" font-weight="800" fill="#0d1117">${esc(v.ad.split(' ').map((p) => p[0]).join('').slice(0, 2))}</text>`;

  let px = 60;
  const haplar = v.etiketler.slice(0, 5).map((e) => { const p = hap(px, 166, e); px += p.w + 12; return p.svg; }).join('');
  const slogan = sar(v.slogan, 64, 1)[0] || '';

  const govde = `
  <defs>
    <clipPath id="avatarKirp"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <linearGradient id="halka" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#79c0ff"/><stop offset="1" stop-color="#a371f7"/></linearGradient>
    <linearGradient id="yildizRenk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#79c0ff"/><stop offset="1" stop-color="#58a6ff"/></linearGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="url(#halka)" stroke-width="3"/>
  ${avatar}
  <path d="M178 79 Q 280 67 384 76" fill="none" stroke="#58a6ff" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>
  <text class="m" x="178" y="68" font-size="13" font-weight="700" fill="#8b949e">@${esc(v.login)}</text>
  <text class="s" x="176" y="114" font-size="40" font-weight="800" fill="#f0f6fc" letter-spacing="-0.5">${esc(v.ad)}</text>
  <text class="s" x="178" y="142" font-size="14" fill="#c9d1d9" fill-opacity="0.85">${esc(slogan)}</text>
  ${haplar}
  <circle class="nabiz" cx="806" cy="44" r="4" fill="#58a6ff"/>
  <text class="s" x="725" y="104" text-anchor="middle" font-size="36" font-weight="800" fill="url(#yildizRenk)">${sayi(v.toplamYildiz)}</text>
  <text class="s" x="725" y="128" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="2.5" fill="#8b949e">TOPLAM YILDIZ</text>`;
  return cerceve(h, govde, { baslik: `${v.ad} — GitHub profili` });
}

// ───────────────────────── 2. terminal başlığı (piksel yazı) ─────────────────────────
const FONT = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '01110 00100 00100 00100 00100 00100 01110', J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  0: '01110 10011 10101 10101 10101 11001 01110', 1: '00100 01100 00100 00100 00100 00100 01110',
  2: '01110 10001 00001 00010 00100 01000 11111', 3: '11110 00001 00001 01110 00001 00001 11110',
  4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
  6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000',
  8: '01110 10001 10001 01110 10001 10001 01110', 9: '01110 10001 10001 01111 00001 00010 01100',
  '.': '00000 00000 00000 00000 00000 01100 01100', '-': '00000 00000 00000 11111 00000 00000 00000',
};
const TR_HARF = {
  Ç: ['C', ['00000', '00000'], '00100'], Ğ: ['G', ['10001', '01110'], null], İ: ['I', ['00000', '00100'], null],
  Ö: ['O', ['00000', '01010'], null], Ş: ['S', ['00000', '00000'], '00100'], Ü: ['U', ['00000', '01010'], null],
};
function glif(c) {
  if (c === ' ') return Array(11).fill('000');
  let taban = c, ust = ['00000', '00000'], alt = '00000';
  if (TR_HARF[c]) { [taban, ust, alt] = TR_HARF[c]; alt = alt || '00000'; }
  const g = FONT[taban];
  if (!g) return Array(11).fill('000');
  return [...ust, '00000', ...g.split(' '), alt];
}

function bannerKarti(v) {
  const metin = (ayar.banner || v.ad).toLocaleUpperCase('tr-TR');
  const glifler = [...metin].map(glif);
  const sutun = glifler.reduce((t, g) => t + g[0].length + 1, -1);
  const hucre = Math.min(9, Math.floor(720 / sutun));
  const genis = sutun * hucre;
  const x0 = Math.round((W - genis) / 2);
  const y0 = 64;
  const h = y0 + 11 * hucre + 46;

  let x = x0, harfler = '';
  glifler.forEach((g, i) => {
    let ana = '', golge = '';
    g.forEach((satir, ry) => [...satir].forEach((b, rx) => {
      if (b !== '1') return;
      const px = x + rx * hucre, py = y0 + ry * hucre;
      golge += `<rect x="${px + 2}" y="${py + 2}" width="${hucre - 0.8}" height="${hucre - 0.8}" rx="1.5"/>`;
      ana += `<rect x="${px}" y="${py}" width="${hucre - 0.8}" height="${hucre - 0.8}" rx="1.5"/>`;
    }));
    harfler += `<g class="harf" style="animation-delay:${(i * 0.09).toFixed(2)}s"><g fill="#1f6feb" fill-opacity="0.28">${golge}</g><g fill="url(#piksel)">${ana}</g></g>`;
    x += (g[0].length + 1) * hucre;
  });

  const govde = `
  <defs>
    <linearGradient id="piksel" gradientUnits="userSpaceOnUse" x1="${x0}" y1="0" x2="${x0 + genis}" y2="0">
      <stop offset="0" stop-color="#79c0ff"/><stop offset="0.55" stop-color="#58a6ff"/><stop offset="1" stop-color="#a371f7"/>
    </linearGradient>
    <linearGradient id="tarama" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#58a6ff" stop-opacity="0"/><stop offset="0.5" stop-color="#58a6ff" stop-opacity="0.12"/><stop offset="1" stop-color="#58a6ff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="ekran"><rect x="22" y="48" width="${W - 44}" height="${h - 70}"/></clipPath>
  </defs>
  <path d="M22 48 V36 a14 14 0 0 1 14 -14 H${W - 36} a14 14 0 0 1 14 14 V48 Z" fill="#161b22" fill-opacity="0.9"/>
  <line x1="22" y1="48" x2="${W - 22}" y2="48" stroke="#30363d"/>
  <circle cx="42" cy="35" r="5" fill="#ff5f56"/><circle cx="58" cy="35" r="5" fill="#ffbd2e"/><circle cx="74" cy="35" r="5" fill="#27c93f"/>
  <text class="m" x="${W / 2}" y="39" text-anchor="middle" font-size="11" fill="#8b949e">${esc(v.login)}@github: ~ $ ./banner.sh --ad</text>
  ${harfler}
  <rect class="imlec" x="${x0 + genis + hucre}" y="${y0 + 9 * hucre}" width="${hucre}" height="${hucre}" fill="#79c0ff"/>
  <g clip-path="url(#ekran)"><rect class="tara" x="22" y="0" width="${W - 44}" height="40" fill="url(#tarama)"/></g>
  <text class="m" x="${W - 40}" y="${h - 30}" text-anchor="end" font-size="9" fill="#484f58">çıkış kodu 0</text>`;
  return cerceve(h, govde, {
    baslik: metin,
    lekeler: [[160, 30, '#1f6feb'], [700, h, '#8957e5']],
    ekStil: `.harf{animation:belir .6s ease-out both}
    .tara{animation:tara 5s linear infinite}
    @keyframes tara{from{transform:translateY(20px)}to{transform:translateY(${h}px)}}`,
  });
}

// ───────────────────────── 3. projeler ─────────────────────────
function halka(cx, cy, r, diller) {
  const C = 2 * Math.PI * r;
  let birikmis = 0;
  const parcalar = diller.map((d) => {
    const uz = d.oran * C;
    const s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.renk || '#8b949e'}" stroke-width="7"
      stroke-dasharray="${Math.max(0, uz - (diller.length > 1 ? 1.2 : 0)).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-birikmis).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    birikmis += uz;
    return s;
  }).join('');
  const ilk = diller[0];
  return `<g class="halka">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#21262d" stroke-width="7"/>
    ${parcalar}
    <text class="m" x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#f0f6fc">%${ilk ? Math.round(ilk.oran * 100) : 0}</text>
    <text class="m" x="${cx}" y="${cy + r + 18}" text-anchor="middle" font-size="9" fill="#8b949e">${esc(ilk ? ilk.ad : '—')}</text>
  </g>`;
}

function projeKutusu(p, x, y, w, h, i) {
  const aciklama = sar(p.aciklama || 'Açıklama eklenmemiş.', 40, 2);
  const konular = p.konular.length ? p.konular : p.diller.slice(0, 3).map((d) => d.ad.toLowerCase());
  let kx = x + 14, haplar = '';
  for (const k of konular.slice(0, 3)) {
    const kw = genislik(k, 10, true) + 16;
    if (kx + kw > x + w - 92) break;
    haplar += `<rect x="${kx}" y="${y + 96}" width="${kw}" height="18" rx="9" fill="#1f6feb" fill-opacity="0.12" stroke="#388bfd" stroke-opacity="0.45"/>
      <text class="m" x="${kx + kw / 2}" y="${y + 108.5}" text-anchor="middle" font-size="10" fill="#79c0ff">${esc(k)}</text>`;
    kx += kw + 6;
  }
  const adGenislik = genislik(p.ad, 15, true);
  return `<g class="kutu" style="animation-delay:${(0.15 * i).toFixed(2)}s">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#0d1117" fill-opacity="0.75" stroke="#30363d"/>
    <text class="m" x="${x + 14}" y="${y + 19}" font-size="10" fill="#8b949e">▸ ${esc(p.tamAd)}</text>
    <line x1="${x}" y1="${y + 28}" x2="${x + w}" y2="${y + 28}" stroke="#21262d"/>
    <circle class="nabiz" cx="${x + w - 16}" cy="${y + 15}" r="3.5" fill="#3fb950"/>
    <text class="m" x="${x + 14}" y="${y + 52}" font-size="15" font-weight="700" fill="#f0f6fc">${esc(p.ad)}</text>
    <rect class="imlec" x="${x + 18 + adGenislik}" y="${y + 50}" width="8" height="2" fill="#f0f6fc"/>
    ${aciklama.map((s, j) => `<text class="m" x="${x + 14}" y="${y + 72 + j * 14}" font-size="10.5" fill="#8b949e">${esc(s)}</text>`).join('')}
    ${haplar}
    <text class="m" x="${x + 14}" y="${y + h - 12}" font-size="10.5" fill="#8b949e"><tspan fill="#58a6ff">★ ${sayi(p.yildiz)}</tspan>   güncellendi ${esc(once(p.guncelleme))}</text>
    ${halka(x + w - 48, y + 72, 25, p.diller)}
  </g>`;
}

function projeKarti(v) {
  const projeler = v.projeler.slice(0, 4);
  const satir = Math.ceil(projeler.length / 2);
  const kw = 366, kh = 140, bosluk = 16;
  const h = 84 + satir * kh + (satir - 1) * 14 + 44;
  const kutular = projeler.map((p, i) =>
    projeKutusu(p, 46 + (i % 2) * (kw + bosluk), 84 + Math.floor(i / 2) * (kh + 14), kw, kh, i)).join('');
  const govde = `
  <text class="m" x="46" y="60" font-size="12" font-weight="700" letter-spacing="2" fill="#58a6ff">PROJELER.LİSTE</text>
  <text class="m" x="200" y="60" font-size="11" fill="#6e7681">./projeler.sh --tumu</text>
  <text class="m" x="794" y="60" text-anchor="end" font-size="11" fill="#6e7681">${projeler.length} proje</text>
  ${kutular}`;
  return cerceve(h, govde, {
    baslik: 'Öne çıkan projeler',
    lekeler: [[150, 40, '#1f6feb'], [700, 60, '#2ea043'], [420, h - 20, '#8957e5']],
    ekStil: `.kutu{animation:belir .7s ease-out both}`,
  });
}

// ───────────────────────── 4. göstergeler ─────────────────────────
function gostergeKarti(v) {
  const h = 230;
  const kalemler = [
    ['Yıldız', v.toplamYildiz, '#58a6ff'],
    ['Katkı', v.katki.toplam, '#39c5cf'],
    ['Depo', v.depoSayisi, '#a371f7'],
    ['Takipçi', v.takipci, '#3fb950'],
  ];
  const kw = (748 - 3 * 14) / 4;
  const kutular = kalemler.map(([ad, deger, renk], i) => {
    const x = 46 + i * (kw + 14), y = 106;
    const hedef = sonrakiHedef(deger);
    const oran = Math.max(0.03, Math.min(1, deger / hedef));
    return `<g class="kutu" style="animation-delay:${(i * 0.12).toFixed(2)}s">
      <rect x="${x}" y="${y}" width="${kw}" height="84" rx="12" fill="#0d1117" fill-opacity="0.7" stroke="#58a6ff" stroke-opacity="0.35"/>
      <text class="s" x="${x + 16}" y="${y + 25}" font-size="12.5" font-weight="700" fill="#c9d1d9">${ad}</text>
      <text class="s" x="${x + kw - 14}" y="${y + 25}" text-anchor="end" font-size="9.5" fill="#6e7681">hedef ${sayi(hedef)}</text>
      <text class="s" x="${x + 16}" y="${y + 58}" font-size="30" font-weight="800" fill="${renk}">${sayi(deger)}</text>
      <rect x="${x + 16}" y="${y + 68}" width="${kw - 32}" height="5" rx="2.5" fill="#21262d"/>
      <rect class="bar" style="animation-delay:${(0.3 + i * 0.12).toFixed(2)}s" x="${x + 16}" y="${y + 68}" width="${((kw - 32) * oran).toFixed(1)}" height="5" rx="2.5" fill="${renk}"/>
    </g>`;
  }).join('');
  const govde = `
  <text class="s" x="46" y="64" font-size="24" font-weight="800" fill="#f0f6fc">Profil Göstergeleri</text>
  <text class="s" x="46" y="86" font-size="12" fill="#8b949e">GitHub verileriyle her gün kendiliğinden güncellenir</text>
  <circle class="nabiz" cx="806" cy="44" r="4" fill="#58a6ff"/>
  ${kutular}`;
  return cerceve(h, govde, {
    baslik: 'Profil göstergeleri',
    lekeler: [[120, 30, '#1f6feb'], [680, 40, '#2ea043'], [520, h, '#8957e5']],
    ekStil: `.kutu{animation:belir .6s ease-out both}
    .bar{transform-box:fill-box;transform-origin:left;animation:doldur 1.4s cubic-bezier(.2,.8,.2,1) both}
    @keyframes doldur{from{transform:scaleX(0)}to{transform:scaleX(1)}}`,
  });
}

// ───────────────────────── 5. katkı etkinliği ─────────────────────────
function katkiKarti(v) {
  const haftalar = v.katki.haftalar.slice(-53);
  const hucre = 11, ara = 3, adim = hucre + ara;
  const x0 = 46 + Math.round((748 - haftalar.length * adim + ara) / 2);
  const y0 = 120;
  const h = y0 + 7 * adim + 40;
  const renkler = ['#161b22', '#0c2d6b', '#1f5fae', '#388bfd', '#79c0ff'];
  const sifirdanBuyuk = haftalar.flat().map((g) => g.sayi).filter((n) => n > 0).sort((a, b) => a - b);
  const esik = [0.25, 0.5, 0.75].map((q) => sifirdanBuyuk[Math.floor(q * (sifirdanBuyuk.length - 1))] || 1);
  const seviye = (n) => (n <= 0 ? 0 : n <= esik[0] ? 1 : n <= esik[1] ? 2 : n <= esik[2] ? 3 : 4);

  const sutunlar = haftalar.map((hafta, i) => {
    const kareler = hafta.map((g) => {
      const gun = new Date(g.tarih + 'T00:00:00Z').getUTCDay();
      return `<rect x="${x0 + i * adim}" y="${y0 + gun * adim}" width="${hucre}" height="${hucre}" rx="2.5" fill="${renkler[seviye(g.sayi)]}"><title>${g.tarih}: ${g.sayi} katkı</title></rect>`;
    }).join('');
    return `<g class="sutun" style="animation-delay:${(i * 0.018).toFixed(3)}s">${kareler}</g>`;
  }).join('');

  const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  let sonAy = -1, ayEtiket = '';
  haftalar.forEach((hafta, i) => {
    const ay = new Date(hafta[0].tarih + 'T00:00:00Z').getUTCMonth();
    if (ay !== sonAy && i < haftalar.length - 2) {
      if (sonAy !== -1 || i === 0) ayEtiket += `<text class="s" x="${x0 + i * adim}" y="${y0 - 8}" font-size="9.5" fill="#6e7681">${aylar[ay]}</text>`;
      sonAy = ay;
    }
  });

  const lx = 794 - 5 * 14 - 26;
  const lejant = `<text class="s" x="${lx - 6}" y="70" text-anchor="end" font-size="10" fill="#8b949e">Az</text>
    ${renkler.map((r, i) => `<rect x="${lx + i * 14}" y="61" width="11" height="11" rx="2.5" fill="${r}"/>`).join('')}
    <text class="s" x="${lx + 5 * 14 + 2}" y="70" font-size="10" fill="#8b949e">Çok</text>`;

  const govde = `
  <text class="s" x="46" y="64" font-size="24" font-weight="800" fill="#f0f6fc">Katkı Etkinliği</text>
  <text class="s" x="46" y="86" font-size="12" fill="#8b949e">Son bir yılda ${sayi(v.katki.toplam)} katkı</text>
  ${lejant}
  ${ayEtiket}
  ${sutunlar}`;
  return cerceve(h, govde, {
    baslik: `Son bir yılda ${v.katki.toplam} katkı`,
    lekeler: [[140, h, '#1f6feb'], [700, 30, '#2ea043'], [420, h, '#8957e5']],
    ekStil: `.sutun{animation:belir .5s ease-out both}`,
  });
}

// ───────────────────────── veri ─────────────────────────
async function gql(sorgu, degiskenler) {
  const yanit = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'profil-kartlari' },
    body: JSON.stringify({ query: sorgu, variables: degiskenler }),
  });
  const j = await yanit.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

const DEPO_ALANLARI = `name owner{login} description stargazerCount pushedAt
  repositoryTopics(first:5){nodes{topic{name}}}
  languages(first:6, orderBy:{field:SIZE, direction:DESC}){totalSize edges{size node{name color}}}`;

function projeyeDonustur(r) {
  const toplam = r.languages.totalSize || 1;
  return {
    ad: r.name,
    tamAd: r.owner.login === ayar.kullanici ? r.name : `${r.owner.login}/${r.name}`,
    aciklama: r.description,
    yildiz: r.stargazerCount,
    guncelleme: r.pushedAt,
    konular: r.repositoryTopics.nodes.map((n) => n.topic.name),
    diller: r.languages.edges.map((e) => ({ ad: e.node.name, renk: e.node.color, oran: e.size / toplam })),
  };
}

async function avatarGetir(url) {
  try {
    const y = await fetch(url);
    const tip = y.headers.get('content-type') || 'image/png';
    return `data:${tip};base64,${Buffer.from(await y.arrayBuffer()).toString('base64')}`;
  } catch { return null; }
}

async function canliVeri() {
  if (!TOKEN) throw new Error('GH_TOKEN tanımlı değil.');
  const login = ayar.kullanici;
  const kok = await gql(`query($login:String!){ user(login:$login){
      login name bio avatarUrl(size:200) followers{totalCount}
      repositories(ownerAffiliations:OWNER, privacy:PUBLIC){totalCount}
      pinnedItems(first:6, types:REPOSITORY){nodes{... on Repository{${DEPO_ALANLARI}}}}
      contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}
  }}`, { login });
  const u = kok.user;

  // tüm depolardan yıldız ve dil toplamı
  let imlec = null, toplamYildiz = 0;
  const dilBoyut = new Map();
  const depolar = [];
  do {
    const d = await gql(`query($login:String!, $imlec:String){ user(login:$login){
      repositories(first:100, after:$imlec, ownerAffiliations:OWNER, privacy:PUBLIC, isFork:false, orderBy:{field:STARGAZERS, direction:DESC}){
        pageInfo{hasNextPage endCursor} nodes{${DEPO_ALANLARI}} } } }`, { login, imlec });
    const r = d.user.repositories;
    for (const n of r.nodes) {
      toplamYildiz += n.stargazerCount;
      depolar.push(n);
      for (const e of n.languages.edges) dilBoyut.set(e.node.name, (dilBoyut.get(e.node.name) || 0) + e.size);
    }
    imlec = r.pageInfo.hasNextPage ? r.pageInfo.endCursor : null;
  } while (imlec);

  let projeler;
  if (ayar.projeler?.length) {
    projeler = [];
    for (const p of ayar.projeler) {
      const [sahip, ad] = p.includes('/') ? p.split('/') : [login, p];
      const d = await gql(`query($sahip:String!, $ad:String!){ repository(owner:$sahip, name:$ad){${DEPO_ALANLARI}} }`, { sahip, ad });
      if (d.repository) projeler.push(projeyeDonustur(d.repository));
    }
  } else {
    const sabit = u.pinnedItems.nodes.filter(Boolean);
    projeler = (sabit.length ? sabit : depolar).slice(0, 4).map(projeyeDonustur);
  }

  const etiketler = ayar.etiketler?.length ? ayar.etiketler
    : [...dilBoyut.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([ad]) => ad);

  return {
    login: u.login,
    ad: ayar.ad || u.name || u.login,
    slogan: ayar.slogan || u.bio || '',
    avatar: await avatarGetir(u.avatarUrl),
    etiketler,
    toplamYildiz,
    depoSayisi: u.repositories.totalCount,
    takipci: u.followers.totalCount,
    katki: {
      toplam: u.contributionsCollection.contributionCalendar.totalContributions,
      haftalar: u.contributionsCollection.contributionCalendar.weeks.map((w) =>
        w.contributionDays.map((g) => ({ tarih: g.date, sayi: g.contributionCount }))),
    },
    projeler,
  };
}

function ornekVeri() {
  let tohum = 42;
  const rnd = () => ((tohum = (tohum * 16807) % 2147483647) / 2147483647);
  const bugun = new Date();
  const bas = new Date(bugun); bas.setUTCDate(bas.getUTCDate() - 364 - bas.getUTCDay());
  const haftalar = []; let toplam = 0;
  for (let d = new Date(bas); d <= bugun; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() === 0) haftalar.push([]);
    const n = rnd() < 0.55 ? 0 : Math.floor(rnd() ** 2 * 9) + 1;
    toplam += n;
    haftalar[haftalar.length - 1].push({ tarih: d.toISOString().slice(0, 10), sayi: n });
  }
  const gun = (n) => new Date(Date.now() - n * 86400000).toISOString();
  const dl = (...a) => a.map(([ad, renk, oran]) => ({ ad, renk, oran }));
  return {
    login: ayar.kullanici, ad: ayar.ad, slogan: ayar.slogan, avatar: null,
    etiketler: ayar.etiketler?.length ? ayar.etiketler : ['Python', 'Jupyter Notebook', 'TypeScript', 'JavaScript'],
    toplamYildiz: 529, depoSayisi: 29, takipci: 230, katki: { toplam, haftalar },
    projeler: [
      { ad: 'goruntu_isleme', tamAd: 'goruntu_isleme', aciklama: 'Görüntü İşleme Dersi Örnekleri', yildiz: 175, guncelleme: gun(3), konular: [], diller: dl(['Jupyter Notebook', '#DA5B0B', 0.96], ['Python', '#3572A5', 0.04]) },
      { ad: 'python_programlama', tamAd: 'python_programlama', aciklama: 'Python programlama dersi örnek kodları ve alıştırmaları', yildiz: 159, guncelleme: gun(12), konular: ['python', 'egitim'], diller: dl(['Python', '#3572A5', 0.88], ['Jupyter Notebook', '#DA5B0B', 0.12]) },
      { ad: 'ileri_internet_programlama', tamAd: 'ileri_internet_programlama', aciklama: 'İleri İnternet Programlama dersi uygulamaları', yildiz: 134, guncelleme: gun(1), konular: ['typescript', 'nodejs', 'web'], diller: dl(['TypeScript', '#3178c6', 0.71], ['JavaScript', '#f1e05a', 0.17], ['CSS', '#563d7c', 0.12]) },
      { ad: 'kodaman', tamAd: 'qpulsar/kodaman', aciklama: 'Kodlama eğitiminde öğrenci bilgisayarlarına kod dağıtan Node.js aracı', yildiz: 4, guncelleme: gun(40), konular: [], diller: dl(['CSS', '#563d7c', 0.52], ['JavaScript', '#f1e05a', 0.33], ['HTML', '#e34c26', 0.15]) },
    ],
  };
}

// ───────────────────────── çalıştır ─────────────────────────
const veri = ORNEK ? ornekVeri() : await canliVeri();
await mkdir(CIKTI, { recursive: true });
const kartlar = {
  '1-baslik.svg': baslikKarti(veri),
  '2-banner.svg': bannerKarti(veri),
  '3-projeler.svg': projeKarti(veri),
  '4-gostergeler.svg': gostergeKarti(veri),
  '5-katki.svg': katkiKarti(veri),
};
for (const [ad, svg] of Object.entries(kartlar)) await writeFile(join(CIKTI, ad), svg);
console.log(`${Object.keys(kartlar).length} kart üretildi → ${CIKTI}`);
