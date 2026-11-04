// Builds the CoRL 2026 poster (48 x 23 in, print at 200 % => 96 x 46 in).
// Usage: node build.js <assets_dir> <out.pptx>   (then: python fix_pptx.py <out.pptx>)
// Body text >= 28 pt; text inside figures/charts >= 20 pt (key labels larger); references 16 pt;
// citation marks [n] are two steps smaller than the surrounding text.
// Look (dot-grid background, 0E58C3 headers, gradient title band, logo placement) follows the
// hand-edited version of the poster.
const pptxgen = require('pptxgenjs');
const path = require('path');
const [, , ASSETS, OUT] = process.argv;
const A = (n) => path.join(ASSETS, n);

const pres = new pptxgen();
pres.defineLayout({ name: 'POSTER', width: 48, height: 23 });
pres.layout = 'POSTER';
pres.author = 'Kaneyoshi Hiratsuka';
pres.title = 'S2A2: Audio-Visual Imitation Learning for Manipulation Tasks Using Acoustic Spatial Information';

// ---------- palette --------------------------------------------------------------
const HEAD = '0E58C3', NAVY = '14305E', BLUE = '2C5AA0', SKY = 'DCE9F8', TXT = '1A1A1A', MUTED = '4A5568';
const ORANGE = 'D9622B', ORANGE_L = 'FCE4D4', GREEN = '3C8D40', GREEN_L = 'DDEFD9', GREY_L = 'E6EAF0', ARROW = 'BF5700';
const SER = { base: '9DB9DB', s2a2: '14305E', spec: 'E8A33D', spat: '5BA85A' };
const FONT = 'Arial';

// ---------- references -----------------------------------------------------------
const REF = { playitbyear: 1, maniwav: 2, audiovla: 3, aslip: 4, music: 5, spotforming: 6, act: 7, dp: 8, vqbet: 9, pi0: 10 };
const REFLIST = [
  'Du et al. Play it by ear. RSS 2022.',
  'Liu et al. ManiWAV. CoRL 2024.',
  'Wei et al. Audio-VLA. arXiv 2025.',
  'Yoo et al. A-SLIP. arXiv 2026.',
  'Schmidt. MUSIC. IEEE Trans. Antennas Propag. 1986.',
  'Kagimoto et al. Spotforming by NMF. IROS 2022.',
  'Zhao et al. ACT. RSS 2023.',
  'Chi et al. Diffusion Policy. IJRR 2024.',
  'Lee et al. VQ-BeT. ICML 2024.',
  'Black et al. π0. arXiv 2024.',
];
const cite = (keys, base, extra) => ({ text: ' [' + [].concat(keys).map((k) => REF[k]).join(', ') + ']', options: Object.assign({ fontSize: base >= 28 ? base - 8 : Math.max(16, base - 6) }, extra || {}) });
const ARR = (extra) => ({ text: '➔ ', options: Object.assign({ color: ARROW, bold: true }, extra || {}) });

const slide = pres.addSlide();
slide.background = { color: 'FFFFFF' };
// dot-grid background (fix_pptx.py swaps this solid fill for the pattern fill)
slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 48, h: 23, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF', width: 0 }, objectName: 'bg-dotgrid' });

// ---------- helpers --------------------------------------------------------------
function text(t, o) {
  slide.addText(t, Object.assign({ fontFace: FONT, color: TXT, isTextBox: true, margin: 0, valign: 'top' }, o));
}
function panel(x, y, w, h, title) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: 'FFFFFF' }, line: { color: BLUE, width: 1.5 }, rectRadius: 0.15 });
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.85, fill: { color: HEAD }, line: { color: HEAD, width: 0 }, rectRadius: 0.15 });
  slide.addShape(pres.ShapeType.rect, { x, y: y + 0.42, w, h: 0.43, fill: { color: HEAD }, line: { color: HEAD, width: 0 } });
  text(title, { x: x + 0.3, y, w: w - 0.6, h: 0.85, fontSize: 40, bold: true, color: 'FFFFFF', valign: 'middle' });
  return { x: x + 0.3, y: y + 1.0, w: w - 0.6, h: h - 1.15, bottom: y + h - 0.15 };
}
function bullets(items, o) {
  const paras = [];
  items.forEach((it, i) => {
    const runs = (Array.isArray(it) ? it : [it]).map((r) => (typeof r === 'string' ? { text: r } : r));
    runs.forEach((r, j) => {
      const opt = Object.assign({}, r.options || {});
      if (j === 0) { if (!o.nobullet) opt.bullet = { indent: 30 }; opt.paraSpaceBefore = i === 0 ? 0 : (o.gap == null ? 4 : o.gap); }  // fix_pptx.py keeps this pPr
      if (j === runs.length - 1 && i < items.length - 1) opt.breakLine = true;
      paras.push({ text: r.text, options: opt });
    });
  });
  text(paras, Object.assign({ fontSize: 28, lineSpacingMultiple: 1.05 }, o));
}
const B = (t) => ({ text: t, options: { bold: true } });
// multi-line text as runs (pptxgenjs puts a run containing '\n' entirely on its own lines, so a following cite would start a new paragraph)
const ML = (t) => t.split('\n').map((l, i, a) => ({ text: l, options: i < a.length - 1 ? { breakLine: true } : {} }));
const C = (t) => ({ text: t, options: { color: BLUE, bold: true } });
function img(name, x, y, w, h, extra) { slide.addImage(Object.assign({ path: A(name), x, y, w, h }, extra || {})); }
function arrow(x1, y1, x2, y2, color, width) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  slide.addShape(pres.ShapeType.line, { x, y, w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH: x2 < x1, flipV: y2 < y1, line: { color: color || NAVY, width: width || 3, endArrowType: 'triangle' } });
}
function line(x1, y1, x2, y2, color, width, dash) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  slide.addShape(pres.ShapeType.line, { x, y, w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH: x2 < x1, flipV: y2 < y1, line: { color: color || NAVY, width: width || 3, dashType: dash || 'solid' } });
}
function box(x, y, w, h, fill, lineColor, radius, lw) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: lineColor || fill, width: lw || 1.5 }, rectRadius: radius == null ? 0.12 : radius });
}
function label(t, x, y, w, h, o) {
  const opts = Object.assign({ x, y, w, h, fontSize: 22, align: 'center', valign: 'middle', bold: true, color: NAVY }, o || {});
  // pptxgenjs starts a new paragraph when a run's align differs from the previous run's: give every run the box align
  if (Array.isArray(t)) t = t.map((r) => ({ text: r.text, options: Object.assign({ align: opts.align }, r.options || {}) }));
  text(t, opts);
}
function captioned(name, x, y, w, h, cap, o) {
  img(name, x, y, w, h);
  label(cap, x, y + h + 0.02, w, 0.4, Object.assign({ fontSize: 20, color: MUTED, bold: false }, o || {}));
}
function marker(n, cx, cy, d) {
  slide.addShape(pres.ShapeType.ellipse, { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color: 'FFFFFF' }, line: { color: '000000', width: 1.5 } });
  text(String(n), { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fontSize: 20, bold: true, color: '000000', align: 'center', valign: 'middle' });
}
const chartBase = {
  barDir: 'col', barGrouping: 'clustered',
  chartColors: [SER.base, SER.s2a2, SER.spec, SER.spat],
  titleFontSize: 24, titleFontFace: FONT, titleColor: NAVY, titleBold: true,
  catAxisLabelFontSize: 20, catAxisLabelFontFace: FONT, catAxisLabelColor: TXT,
  valAxisLabelFontSize: 20, valAxisLabelFontFace: FONT, valAxisLabelColor: TXT,
  valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 50,
  valGridLine: { color: 'D0D7E2', size: 1 }, catGridLine: { style: 'none' },
  catAxisLineShow: true, valAxisLineShow: false,
  plotArea: { fill: { color: 'FFFFFF' } },
  dataLabelFontSize: 22, dataLabelFontFace: FONT, dataLabelColor: TXT,
};
function legendRow(x, y, items, fontSize) {
  let lx = x;
  items.forEach(([n, c]) => {
    slide.addShape(pres.ShapeType.rect, { x: lx, y: y + 0.09, w: 0.36, h: 0.36, fill: { color: c }, line: { color: c, width: 0 } });
    const tw = n.length * (fontSize || 22) * 0.0071 + 0.2;
    text(n, { x: lx + 0.44, y, w: tw, h: 0.54, fontSize: fontSize || 22, valign: 'middle' });
    lx += 0.44 + tw + 0.3;
  });
  return lx;
}
const ERR = {};   // chart key ('#<n>' = n-th chart) -> per-series STD, injected as error bars by fix_pptx.py
let chartCount = 0;

// ============================ HEADER ==============================================
const HH = 3.0;
img('band.png', 0, 0, 48, HH);
img('kyoto.png', 0.02, -0.01, 3.0, 3.0);
img('riken.png', 3.0, 0.25, 4.42, 1.35);
img('mmai.png', 3.3, 1.63, 3.68, 1.23);
img('corl_logo.png', 41.65, -0.08, 6.0, 3.0);
text('S2A2: Audio-Visual Imitation Learning for Manipulation Tasks\nUsing Acoustic Spatial Information',
  { x: 8.2, y: 0.15, w: 32.4, h: 1.75, fontSize: 56, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', lineSpacingMultiple: 0.95 });
text([
  { text: 'Kaneyoshi Hiratsuka' }, { text: '1,2', options: { superscript: true } },
  { text: '    Benjamin Yen' }, { text: '2,3', options: { superscript: true } },
  { text: '    Ryosuke Kojima' }, { text: '1,2', options: { superscript: true } },
], { x: 8.2, y: 1.9, w: 32.4, h: 0.6, fontSize: 38, color: 'FFFFFF', align: 'center', valign: 'middle' });
text([
  { text: '1', options: { superscript: true } }, { text: 'Kyoto University    ' },
  { text: '2', options: { superscript: true } }, { text: 'RIKEN    ' },
  { text: '3', options: { superscript: true } }, { text: 'Institute of Science Tokyo' },
], { x: 8.2, y: 2.45, w: 32.4, h: 0.5, fontSize: 30, color: 'DCE9F8', align: 'center', valign: 'middle' });

// column geometry
const Y0 = HH + 0.3, YEND = 22.6, GAP = 0.3;
const LX = 0.4, LW = 14.4, MX = 15.15, MW = 17.7, RX = 33.2, RW = 14.4;
const BG_H = 8.9, FW_H = 8.9, CC_H = 4.2, CT_H = 5.3, RR_H = YEND - Y0 - CC_H - CT_H - 2 * GAP;

// ============================ LEFT: BACKGROUND ====================================
{
  const p = panel(LX, Y0, LW, BG_H, 'Background');
  const ih = 3.15, iw = ih * 1.5;
  const tw = p.w - iw - 0.35;
  bullets([
    ['Vision-only policies fail when objects ', B('look identical'), ' or their state is ', B('hidden'), cite(['playitbyear', 'maniwav'], 28), '.'],
    ['Sound tells ', C('WHERE'), ' a source is and ', C('WHAT'), ' it is.'],
    ['Existing audio policies use only ', B('acoustic spectral'), ' cues; ', B('acoustic spatial'), ' cues have not been given to a manipulation policy', cite(['playitbyear', 'maniwav', 'audiovla'], 28), '.'],
  ], { x: p.x, y: p.y, w: tw, h: ih + 0.45 });
  captioned('bg_sort.jpg', p.x + tw + 0.35, p.y, iw, ih, 'Sort by acoustic cues');
  const ty = p.y + ih + 0.65;
  const cell = (t, o) => ({ text: t, options: Object.assign({ fontFace: FONT, fontSize: 24, align: 'center', valign: 'middle', color: TXT, margin: 0.04 }, o || {}) });
  const hdr = (t, col) => cell(t, { bold: true, color: 'FFFFFF', fill: { color: col } });
  const lab = (t, f) => ({ text: t, options: Object.assign({ fontFace: FONT, fontSize: 24, align: 'left', valign: 'middle', bold: true, color: NAVY, margin: [0.04, 0.04, 0.04, 0.12] }, f) });
  const labc = (t, key, f) => ({ text: [{ text: t, options: { align: 'left', fontSize: 24 } }, { text: ' [' + REF[key] + ']', options: { align: 'left', fontSize: 18 } }], options: Object.assign({ fontFace: FONT, fontSize: 24, align: 'left', valign: 'middle', bold: true, color: NAVY, margin: [0.04, 0.04, 0.04, 0.12] }, f) });
  const yes = (col, f) => cell('✓', Object.assign({ bold: true, color: col, fontSize: 30 }, f));
  const no = (f) => cell('–', Object.assign({ color: 'A0A8B8', fontSize: 30 }, f));
  const alt = { fill: { color: 'EEF3FA' } }, ours = { fill: { color: SKY } };
  const rows = [
    [hdr('', HEAD), hdr('Robot\npolicy', HEAD), hdr('Acoustic\nspatial info', ORANGE), hdr('Acoustic\nspectral info', GREEN)],
    [labc('Audio-VLA', 'audiovla', alt), yes(HEAD, alt), no(alt), yes(GREEN, alt)],
    [labc('A-SLIP', 'aslip', {}), no({}), yes(ORANGE, {}), yes(GREEN, {})],
    [lab('S2A2 (ours)', Object.assign({ color: BLUE }, ours)), yes(HEAD, ours), yes(ORANGE, ours), yes(GREEN, ours)],
  ];
  slide.addTable(rows, { x: p.x, y: ty, w: p.w, colW: [4.5, 3.1, 3.1, 3.1], rowH: [0.8, 0.62, 0.62, 0.62], border: { type: 'solid', color: 'C9D3E3', pt: 1 }, fontFace: FONT });
  bullets([
    [ARR(), C('S2A2: '), 'the first manipulation policy that ', B('explicitly'), ' uses acoustic spatial (', C('WHERE'), ') and acoustic spectral (', C('WHAT'), ') information.'],
  ], { x: p.x, y: ty + 2.66 + 0.15, w: p.w, h: p.bottom - (ty + 2.81), nobullet: true });
}

// ============================ MIDDLE: FRAMEWORK ===================================
{
  const p = panel(MX, Y0, MW, FW_H, 'S2A2 Framework: Spatial-Spectral Audio Action');
  bullets([
    [C('Key idea: '), 'explicit ', B('acoustic spatial map'), ' (', C('WHERE'), ') + ', B('spectrogram'), ' (', C('WHAT'), ') + vision ', ARR(), 'policy'],
  ], { x: p.x, y: p.y, w: p.w, h: 0.55, nobullet: true });
  const dy = p.y + 0.6, dh = p.bottom - dy;
  const envX = p.x, envW = 3.2, pipX = envX + envW + 0.3, pipW = 8.0;
  const mpX = pipX + pipW + 0.3, catW = 0.9, polW = 1.7, mpW = catW + 0.35 + polW;
  const tskX = mpX + mpW + 0.3, tskW = p.x + p.w - tskX;
  label('Environment', envX, dy, envW, 0.45, { fontSize: 24 });
  label('Processing Pipelines', pipX, dy, pipW, 0.45, { fontSize: 24 });
  label('Multimodal Policy', mpX, dy, mpW, 0.45, { fontSize: 24 });
  label('Tasks', tskX, dy, tskW, 0.45, { fontSize: 24 });
  const by = dy + 0.5, bh = dh - 0.5;

  // ---- Environment (real robot)
  box(envX, by, envW, bh, GREY_L, GREY_L);
  img('icon_cam.png', envX + 0.2, by + 0.15, 0.7, 0.7);
  label('RGB\nCamera', envX + 1.0, by + 0.08, envW - 1.1, 0.85, { align: 'left', fontSize: 22 });
  const envImW = envW - 0.3, envImH = envImW * 1479 / 2423, envImY = by + 1.05;
  img('env_crop.jpg', envX + 0.15, envImY, envImW, envImH);
  const micY = envImY + envImH + 0.15;
  img('icon_mic.png', envX + 0.2, micY, 0.7, 0.7);
  label('Microphone\nArrays', envX + 1.0, micY - 0.07, envW - 1.1, 0.85, { align: 'left', fontSize: 22 });
  const canW = envW - 0.3, canH = canW * 1265 / 2120, canX = envX + 0.15;
  img('cans.jpg', canX, micY + 0.85, canW, canH);
  label('Ambiguous visuals', envX, by + bh - 0.45, envW, 0.4, { fontSize: 20, color: MUTED });

  // ---- three pipeline rows
  const rowGap = 0.12, rowH = (bh - 2 * rowGap) / 3;
  const encW = 1.5, encX = pipX + pipW - encW - 0.15;
  const ih = Math.min(rowH - 0.62, 1.35);
  const imOff = 0.5 + (rowH - 0.5 - ih) / 2;        // images centred below the row title
  const im1 = pipX + 0.2, im2 = im1 + ih + 0.4;
  const rows = [
    { fill: 'EAF1FA', lc: BLUE, enc: 'Vision\nEncoder', encFill: SKY, title: 'RGB Image' },
    { fill: ORANGE_L, lc: ORANGE, enc: 'Spatial\nEncoder', encFill: 'F6C6A8', title: 'Acoustic Spatial Map' },
    { fill: GREEN_L, lc: GREEN, enc: 'Spectral\nEncoder', encFill: 'BFE0BA', title: 'Spectrogram' },
  ];
  const rowTop = [], rowMid = [];
  rows.forEach((r, i) => {
    const ry = by + i * (rowH + rowGap);
    rowTop.push(ry);
    box(pipX, ry, pipW, rowH, r.fill, r.lc);
    label(r.title, pipX + 0.2, ry + 0.05, pipW - 0.4, 0.45, { fontSize: 24, color: r.lc });
    const iy = ry + imOff;
    rowMid.push(iy + ih / 2);
    box(encX, iy, encW, ih, r.encFill, r.lc);
    label(r.enc, encX, iy, encW, ih, { fontSize: 22, color: TXT });
    arrow(encX - 0.4, iy + ih / 2, encX - 0.05, iy + ih / 2, r.lc, 2.5);
  });
  const noteX = im2 + ih + 0.12, noteW = encX - 0.4 - noteX;
  {
    const iy = rowTop[0] + imOff;
    img('cam_top_small.png', im1, iy, ih, ih);
    img('cam_wrist.png', im2, iy, ih, ih);
    label('top-down and\nwrist cameras', noteX, iy, noteW, ih, { fontSize: 20, bold: false, color: TXT, align: 'left' });
  }
  const mapY1 = rowTop[1] + imOff;
  {
    const iy = mapY1;
    img('env_crop.jpg', im1, iy, ih, ih, { sizing: { type: 'cover', w: ih, h: ih } });
    img('spatial_map.png', im2, iy, ih, ih);
    const d = 0.36, corners = [[2, 0.14, 0.14], [3, 0.86, 0.14], [1, 0.14, 0.86], [4, 0.86, 0.86]];
    corners.forEach(([n, fx, fy]) => { marker(n, im1 + fx * ih, iy + fy * ih, d); marker(n, im2 + fx * ih, iy + fy * ih, d); });
    arrow(im1 + ih + 0.08, iy + ih / 2, im2 - 0.08, iy + ih / 2, ORANGE, 2.5);
    label(ML('likelihood of the\nsource position\n(localized by\nMUSIC').concat([cite('music', 20), { text: ')' }]), noteX, iy - 0.05, noteW, ih + 0.1, { fontSize: 20, bold: false, color: TXT, align: 'left' });
  }
  {
    const iy = rowTop[2] + imOff;
    img('spatial_map.png', im1, iy, ih, ih);
    slide.addShape(pres.ShapeType.star5, { x: im1 + 0.656 * ih - 0.13, y: iy + 0.281 * ih - 0.13, w: 0.26, h: 0.26, fill: { color: 'FFE000' }, line: { color: '000000', width: 1 } });
    arrow(im1 + ih + 0.08, iy + ih / 2, im2 - 0.08, iy + ih / 2, GREEN, 2.5);
    img('real_spec.png', im2, iy, ih, ih);
    label(ML('separated\nsound at ★\n(beamforming\n+ NMF').concat([cite('spotforming', 20), { text: ')' }]), noteX, iy - 0.05, noteW, ih + 0.1, { fontSize: 20, bold: false, color: TXT, align: 'left' });
    const x1 = im2 + ih / 2, x2 = im1 + ih / 2, yb = rowTop[2] - rowGap / 2;
    line(x1, mapY1 + ih, x1, yb, ORANGE, 2.5);
    line(x1, yb, x2, yb, ORANGE, 2.5);
    arrow(x2, yb, x2, iy - 0.02, ORANGE, 2.5);
  }
  // environment -> pipelines (elbow connectors as in the hand-edited version)
  const busX = envX + envW + 0.15;
  line(envX + envW, by + 0.5, busX, by + 0.5, BLUE, 2.5);
  line(busX, by + 0.5, busX, rowMid[0], BLUE, 2.5);
  arrow(busX, rowMid[0], pipX, rowMid[0], BLUE, 2.5);
  const mY = micY + 0.35;
  line(envX + envW, mY, busX, mY, GREEN, 2.5);
  line(busX, rowMid[1], busX, rowMid[2], GREEN, 2.5);
  arrow(busX, rowMid[1], pipX, rowMid[1], ORANGE, 2.5);
  arrow(busX, rowMid[2], pipX, rowMid[2], GREEN, 2.5);

  // ---- multimodal policy
  box(mpX, by, mpW, bh, GREY_L, GREY_L);
  const catX = mpX, catY = by + 0.3, catH = bh - 0.6;
  box(catX, catY, catW, catH, SKY, BLUE);
  text('Feature Concat  (+ proprioception)', { x: catX + catW / 2 - catH / 2, y: catY + catH / 2 - catW / 2, w: catH, h: catW, rotate: 270, fontSize: 22, bold: true, color: NAVY, align: 'center', valign: 'middle' });
  rows.forEach((r, i) => arrow(encX + encW, rowMid[i], catX, rowMid[i], r.lc, 2.5));
  const polX = catX + catW + 0.35;
  box(polX, catY, polW, catH, 'FDE9CF', 'E0A050');
  text([
    { text: 'Policy\nNetwork\n', options: { bold: true, color: NAVY, fontSize: 24, breakLine: true } },
    { text: '✓ ACT' }, cite('act', 22, { breakLine: true }),
    { text: '✓ Diffusion\n   Policy' }, cite('dp', 22, { breakLine: true }),
    { text: '✓ VQ-BeT' }, cite('vqbet', 22, { breakLine: true }),
    { text: '✓ π' }, { text: '0', options: { subscript: true } }, cite('pi0', 22),
  ], { x: polX + 0.08, y: catY + 0.05, w: polW - 0.16, h: catH - 0.1, fontSize: 22, align: 'center', valign: 'middle', lineSpacingMultiple: 1.0 });
  arrow(catX + catW, by + bh / 2, polX, by + bh / 2, NAVY, 3);

  // ---- tasks
  box(tskX, by, tskW, bh, 'F3E3F5', 'F3E3F5');
  const tiw = tskW - 0.2, tih = tiw * 0.75;
  const tgap = (bh - 2 * (tih + 0.72)) / 3;
  img('photo_li.jpg', tskX + 0.1, by + tgap, tiw, tih);
  label('Localization &\nidentification', tskX - 0.2, by + tgap + tih + 0.02, tskW + 0.4, 0.7, { fontSize: 20 });
  img('photo_ex.jpg', tskX + 0.1, by + 2 * tgap + tih + 0.72, tiw, tih);
  label('Exploratory\nbehavior', tskX - 0.2, by + 2 * tgap + 2 * tih + 0.74, tskW + 0.4, 0.7, { fontSize: 20 });
  arrow(polX + polW, by + bh / 2, tskX, by + bh / 2, NAVY, 3);
}

// ============================ BOTTOM LEFT+MIDDLE: TASKS + SIMULATION RESULTS =======
const CAP = { WHERE: [ORANGE, ORANGE_L], WHAT: [GREEN, GREEN_L], EXPLORE: [BLUE, SKY] };
{
  const PY = Y0 + BG_H + GAP, PW = MX + MW - LX;
  const p = panel(LX, PY, PW, YEND - PY, 'Acoustic-aware Manipulation Tasks & Simulation Results');
  // --- row A: intro + legend
  bullets([
    ['Four ', B('diagnostic tasks'), ': grasp the right object, drop it into the right box.'],
  ], { x: p.x, y: p.y, w: 15.5, h: 0.55, nobullet: true });
  legendRow(p.x + 15.6, p.y, [['Baseline (RGB only)', SER.base], ['S2A2 (ours)', SER.s2a2], ['w/o Spec. (no spectrogram)', SER.spec], ['w/o Spat. (no spatial map)', SER.spat]]);

  // --- row B: four task cards, each with its simulation chart
  const cats = ['ACT', 'DP', 'VQ-BeT', 'π0'];
  const cards = [
    { icon: 'icon_L.png', shot: 'task_L.png', title: 'Localization', need: ['WHERE'],
      pts: ['2 look-alikes, 1 box', 'One emits a sound', 'Carry the sounder'],
      base: [20.3, 13.3, 12.7, 18.3], s2a2: [73.0, 68.0, 40.3, 32.0], spec: [74.7, 68.3, 44.7, 17.3], spat: [15.3, 15.3, 12.3, 14.7],
      sd: [[7.2, 1.2, 6.8, 2.3], [5.6, 3.6, 4.5, 9.9], [4.7, 13.7, 5.5, 5.0], [4.0, 1.2, 3.8, 5.7]] },
    { icon: 'icon_I.png', shot: 'task_I.png', title: 'Identification', need: ['WHAT'],
      pts: ['1 object, 2 boxes', 'It emits sound A or B', 'Box chosen by timbre'],
      base: [39.3, 41.3, 24.0, 32.3], s2a2: [76.7, 67.7, 32.3, 73.3], spec: [44.3, 32.7, 32.7, 40.0], spat: [74.3, 80.3, 49.3, 78.7],
      sd: [[4.0, 2.5, 6.9, 2.1], [1.2, 7.2, 10.0, 8.4], [2.3, 3.1, 3.1, 11.4], [7.0, 3.8, 9.8, 6.0]] },
    { icon: 'icon_LI.png', shot: 'task_LI.png', title: 'L&I', need: ['WHERE', 'WHAT'], star: true,
      pts: ['2 look-alikes, 2 boxes', 'One emits A or B', 'Find it, box by timbre'],
      base: [11.0, 9.3, 7.7, 7.0], s2a2: [78.7, 89.7, 55.3, 45.7], spec: [45.0, 46.0, 32.3, 14.3], spat: [25.7, 8.7, 19.0, 19.7],
      sd: [[3.5, 6.1, 1.2, 4.0], [2.1, 2.1, 11.7, 8.1], [3.6, 5.3, 7.5, 2.9], [3.1, 3.8, 1.0, 3.8]] },
    { icon: 'icon_Ex.png', shot: 'task_Ex.png', title: 'Exploratory', need: ['WHERE', 'WHAT', 'EXPLORE'],
      pts: ['2 look-alikes, 1 box', 'Sounds only when moved', 'Lift & shake to find it'],
      base: [35.0, 26.3, 17.3, 9.0], s2a2: [77.3, 44.0, 32.7, 18.7], spec: [75.3, 37.3, 20.0, 26.7], spat: [72.3, 6.3, 25.0, 9.3],
      sd: [[5.3, 0.6, 5.8, 1.0], [5.7, 3.6, 12.7, 4.2], [5.0, 8.1, 20.0, 3.2], [8.4, 2.3, 3.6, 10.4]] },
  ];
  const cy0 = p.y + 0.7, ch = 5.0, cw = (p.w - 3 * 0.3) / 4;
  const rightW = 1.95, iconH = rightW * 695 / 1200, shot = 1.45;
  cards.forEach((c, i) => {
    const cx = p.x + i * (cw + 0.3), cy = cy0;
    const rx = cx + cw - rightW - 0.15, lw = cw - rightW - 0.45;
    box(cx, cy, cw, ch, 'F7F9FC', BLUE);
    text(c.title, { x: cx + 0.25, y: cy + 0.08, w: lw, h: 0.5, fontSize: 32, bold: true, color: NAVY, valign: 'middle' });
    let px = cx + 0.25;
    c.need.forEach((n) => {
      const pw = n.length * 0.17 + 0.35, [fg, bg] = CAP[n];
      box(px, cy + 0.62, pw, 0.4, bg, bg, 0.1);
      text(n, { x: px, y: cy + 0.62, w: pw, h: 0.4, fontSize: 20, bold: true, color: fg, align: 'center', valign: 'middle' });
      px += pw + 0.1;
    });
    img(c.icon, rx, cy + 0.08, rightW, iconH);
    img(c.shot, rx + (rightW - shot) / 2, cy + 1.15, shot, shot);
    bullets(c.pts, { x: cx + 0.25, y: cy + 1.1, w: lw, h: 1.5, gap: 2 });
    // simulation success rate (%) for this task, mean ± STD over 3 seeds
    const chx = cx + 0.1, chy = cy + 2.65, chw = cw - 0.2, chh = ch - 2.65 - 0.08;
    chartCount += 1;
    ERR['#' + chartCount] = c.sd;
    slide.addChart(pres.ChartType.bar, [
      { name: 'Baseline', labels: cats, values: c.base },
      { name: 'S2A2', labels: cats, values: c.s2a2 },
      { name: 'w/o Spec.', labels: cats, values: c.spec },
      { name: 'w/o Spat.', labels: cats, values: c.spat },
    ], Object.assign({}, chartBase, { x: chx, y: chy, w: chw, h: chh, barGapWidthPct: 40, showTitle: false, showLegend: false }));
    if (c.star) {
      slide.addShape(pres.ShapeType.roundRect, { x: chx - 0.02, y: chy - 0.02, w: chw + 0.04, h: chh + 0.04, fill: { type: 'none' }, line: { color: ORANGE, width: 4 }, rectRadius: 0.1 });
      label('★ S2A2 best, all 4 policies', cx + 1.3, cy + 0.1, lw - 1.1, 0.46, { fontSize: 20, color: ORANGE, align: 'left' });
    }
  });

  // --- row C: simulation setup (left) + t-SNE latent space (right)
  const sy = cy0 + ch + 0.2, sh = p.bottom - sy - 0.5;   // 0.5 reserved for the conclusion line
  const dH = 2.0, dW = dH * 456 / 400, dx = p.x, dyy = sy + 0.15;
  img('sim_topdown.png', dx, dyy, dW, dH);
  const ccx = dx + dW * 0.595, ccy = dyy + dH * 0.5, cr = dH * 0.33;
  slide.addShape(pres.ShapeType.ellipse, { x: ccx - cr, y: ccy - cr, w: 2 * cr, h: 2 * cr, fill: { type: 'none' }, line: { color: '000000', width: 2, dashType: 'dash' } });
  [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4].forEach((a) => {
    const mx = ccx + cr * Math.cos(a), my = ccy - cr * Math.sin(a), d = 0.32;
    slide.addShape(pres.ShapeType.octagon, { x: mx - d / 2, y: my - d / 2, w: d, h: d, fill: { color: 'FFC000' }, line: { color: 'B08000', width: 1 } });
  });
  img('icon_cam.png', dx + dW * 0.56 - 0.25, dyy - 0.1, 0.5, 0.5);
  label('side cam.', dx + dW * 0.56 + 0.28, dyy - 0.1, 1.5, 0.5, { fontSize: 20, align: 'left' });
  img('icon_cam.png', dx + dW + 0.08, ccy - 0.25, 0.5, 0.5);
  label('front\ncam.', dx + dW + 0.08, ccy + 0.25, 1.0, 0.65, { fontSize: 20, align: 'left' });
  slide.addShape(pres.ShapeType.octagon, { x: dx, y: dyy + dH + 0.08, w: 0.28, h: 0.28, fill: { color: 'FFC000' }, line: { color: 'B08000', width: 1 } });
  label(': mic array', dx + 0.33, dyy + dH + 0.03, dW, 0.38, { fontSize: 20, bold: false, color: MUTED, align: 'left' });
  const sbx = dx + dW + 1.15, sbw = 11.4;
  bullets([
    [B('Setup: '), 'Genesis (physics) + Pyroomacoustics (acoustics)'],
    [B('4 microphone arrays'), ' on a 300 mm circle, 10 FPS'],
    [B('Front + side cameras'), ', 224×224 RGB, 30 FPS'],
    ['100 / 200 demos per task; bars: success rate (%),'],
    ['100 trials × 3 seeds, mean ± STD; DP = Diffusion Policy'],
  ], { x: sbx, y: sy, w: sbw, h: sh, gap: 0, nobullet: true, lineSpacingMultiple: 1.0 });

  // t-SNE: 8 panels in one row (sound type | source Y-coordinate), as large as the strip allows
  const tx0 = sbx + sbw + 0.3, txw = p.x + p.w - tx0;
  const ph = sh - 0.36 - 0.34 - 0.08, pw = ph * 755 / 907, g = 0.08, ggap = 0.4, legW1 = 1.5, legW2 = 1.4;
  const used = 8 * pw + 6 * g + ggap + 0.2 + legW1 + 0.2 + legW2;
  const ox = tx0 + Math.max(0, (txw - used) / 2);
  const conds = ['Baseline', 'S2A2', 'w/o Spec.', 'w/o Spat.'];
  const hy = sy + 0.36, py = hy + 0.34;
  const groupX = [ox, ox + 4 * pw + 3 * g + 0.2 + legW1 + ggap];
  label('Latent space of DP on L&I (t-SNE): color = sound type', groupX[0] - 0.2, sy, 4 * pw + 3 * g + 0.2 + legW1 + 0.4, 0.36, { fontSize: 20, align: 'left' });
  label('color = Y-coordinate of the sounding object', groupX[1] - 0.2, sy, 4 * pw + 3 * g + 0.2 + legW2 + 0.4, 0.36, { fontSize: 20, align: 'left' });
  [0, 1].forEach((r) => {
    conds.forEach((c, j) => {
      const x = groupX[r] + j * (pw + g);
      label(c, x - 0.1, hy, pw + 0.2, 0.34, { fontSize: 20, color: j === 1 ? NAVY : MUTED });
      img(`tsne_r${r}_c${j}.png`, x, py, pw, ph);
    });
    const sx2 = groupX[r] + (pw + g) - 0.05;
    slide.addShape(pres.ShapeType.roundRect, { x: sx2, y: py - 0.05, w: pw + 0.1, h: ph + 0.1, fill: { type: 'none' }, line: { color: ORANGE, width: 4 }, rectRadius: 0.06 });
  });
  const k1 = groupX[0] + 4 * pw + 3 * g + 0.2;
  slide.addShape(pres.ShapeType.rect, { x: k1, y: py + 0.1, w: 0.34, h: 0.34, fill: { color: 'FF7F0E' }, line: { color: 'FF7F0E', width: 0 } });
  label('sound A', k1 + 0.42, py + 0.02, legW1 - 0.4, 0.5, { fontSize: 20, bold: false, align: 'left', color: TXT });
  slide.addShape(pres.ShapeType.rect, { x: k1, y: py + 0.6, w: 0.34, h: 0.34, fill: { color: '1F77B4' }, line: { color: '1F77B4', width: 0 } });
  label('sound B', k1 + 0.42, py + 0.52, legW1 - 0.4, 0.5, { fontSize: 20, bold: false, align: 'left', color: TXT });
  const k2 = groupX[1] + 4 * pw + 3 * g + 0.2;
  img('tsne_cbar.png', k2, py, 0.3, ph);
  label('+0.3', k2 + 0.38, py - 0.05, 1.0, 0.3, { fontSize: 20, bold: false, align: 'left', color: TXT });
  label('0', k2 + 0.38, py + ph / 2 - 0.15, 1.0, 0.3, { fontSize: 20, bold: false, align: 'left', color: TXT });
  label('−0.3 m', k2 + 0.38, py + ph - 0.25, 1.4, 0.3, { fontSize: 20, bold: false, align: 'left', color: TXT });
  // conclusion line (full width)
  bullets([
    [ARR(), B('S2A2 separates both cues'), '; w/o Spat. loses position, w/o Spec. loses timbre: the two acoustic cues play ', B('independent roles'), '.'],
  ], { x: p.x, y: p.bottom - 0.5, w: p.w, h: 0.5, nobullet: true });
}

// ============================ RIGHT: REAL ROBOT ===================================
{
  const p = panel(RX, Y0, RW, RR_H, 'Real Robot Results');
  const ph = 2.6, pw = ph / 0.625;
  captioned('real_env.jpg', p.x, p.y, pw, ph, 'Top-down view, 4 mic arrays');
  bullets([
    ['ILOHA arm (ALOHA-type', cite('act', 28), '): 6 joints + gripper'],
    ['4 TAMAGO-03 arrays (8 ch, 16 kHz) at the corners of a 1.2 × 0.6 m rectangle'],
    ['Top-down + wrist RGB camera (224×224 pixels)'],
    [B('ACT'), '; 100 teleop demos per task; 100 trials'],
  ], { x: p.x + pw + 0.3, y: p.y, w: p.w - pw - 0.3, h: ph + 0.45, gap: 1 });
  const cy = p.y + ph + 0.55, ch = p.bottom - cy - 1.5, cw = 6.2;
  chartCount += 1;
  slide.addChart(pres.ChartType.bar, [
    { name: 'Baseline', labels: ['L&I', 'Exploratory'], values: [5, 12] },
    { name: 'S2A2', labels: ['L&I', 'Exploratory'], values: [72, 50] },
    { name: 'w/o Spec.', labels: ['L&I', 'Exploratory'], values: [18, 33] },
    { name: 'w/o Spat.', labels: ['L&I', 'Exploratory'], values: [3, 27] },
  ], Object.assign({}, chartBase, {
    x: p.x, y: cy, w: cw, h: ch, barGapWidthPct: 35, valAxisMajorUnit: 25, catAxisLabelFontSize: 22,
    showTitle: true, title: 'Success rate (%), 100 trials',
    showLegend: true, legendPos: 'r', legendFontSize: 20, legendFontFace: FONT, legendColor: TXT,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0',
  }));
  const sx = p.x + cw + 0.3, sw = p.w - cw - 0.3, sh = sw * 704 / 1452;
  const titleH = 0.45, capH = 0.75, blockH = titleH + 0.05 + sh + 0.05 + capH;
  const sy = cy + Math.max(0, (ch + 1.5 - blockH) / 2);
  label('S2A2 + ACT on the exploratory task  (time →)', sx, sy, sw, titleH, { fontSize: 22 });
  img('real_seq.png', sx, sy + titleH + 0.05, sw, sh);
  label('Top: robot.  Middle: acoustic spatial map on the top-down view.  Bottom: spectrogram.', sx, sy + titleH + 0.1 + sh, sw, capH, { fontSize: 20, color: MUTED, bold: false });
  bullets([
    [B('S2A2 wins both tasks'), '; acoustic spatial + spectral cues > either alone.'],
  ], { x: p.x, y: p.bottom - 1.47, w: cw + 0.2, h: 1.47, nobullet: true });
}

// ============================ RIGHT: CONCLUSION ===================================
{
  const PY = Y0 + RR_H + GAP;
  const p = panel(RX, PY, RW, CC_H, 'Conclusion & Limitations');
  bullets([
    [C('✔ '), 'Explicit ', B('spatial map + spectrogram'), ' is best when a task needs both ', C('WHERE'), ' and ', C('WHAT'), ' (sim: all 4 policies; real: 72 % / 50 %).'],
    [C('✔ '), 'Unneeded acoustic pipelines can hurt with few demos; the gain depends on the policy architecture.'],
    [{ text: '⚠ ', options: { color: ORANGE, bold: true } }, 'Single source, known array placement, exploration imitated from demos. Next: multi-source, sim-to-real.'],
  ], { x: p.x, y: p.y - 0.05, w: p.w, h: p.h, gap: 3, nobullet: true });
}

// ============================ RIGHT: CONTACT & REFERENCES ==========================
{
  const PY = Y0 + RR_H + GAP + CC_H + GAP;
  const p = panel(RX, PY, RW, CT_H, 'Contact & References');
  text([
    { text: 'Kaneyoshi Hiratsuka', options: { bold: true, breakLine: true } },
    { text: 'Kyoto University / RIKEN', options: { breakLine: true } },
    { text: 'hiratsuka.kaneyoshi.i62@kyoto-u.jp', options: { breakLine: true } },
    { text: 'https://azuma413.github.io/' },
  ], { x: p.x, y: p.y, w: 6.8, h: 2.1, fontSize: 28, lineSpacingMultiple: 1.05 });
  const qs = [['qr_arxiv.png', 'Paper'], ['qr_code.png', 'Code'], ['qr_webpage.png', 'Webpage']];
  const qsz = 1.55, qy = p.y + 2.25;
  qs.forEach(([f, n], i) => {
    const qx = p.x + i * (qsz + 0.35);
    img(f, qx, qy, qsz, qsz);
    label(n, qx - 0.2, qy + qsz + 0.02, qsz + 0.4, 0.4, { fontSize: 24 });
  });
  const refs = REFLIST.map((t, i) => `[${i + 1}] ${t}`).concat([
    'Acknowledgments: JST CREST (JPMJCR22D3), JST Moonshot R&D (JPMJMS2024), JSPS KAKENHI (JP26H02532, JP26H02525), RIKEN TRIP initiative (AGIS).',
  ]).map((t, i, a) => ({ text: t, options: { breakLine: i < a.length - 1, paraSpaceBefore: t.startsWith('Ack') ? 6 : 0 } }));
  text(refs, { x: p.x + 7.0, y: p.y - 0.05, w: p.w - 7.0, h: p.h + 0.05, fontSize: 16, color: MUTED, lineSpacingMultiple: 1.0 });
}

pres.writeFile({ fileName: OUT }).then(() => { require('fs').writeFileSync(OUT + '.errbars.json', JSON.stringify(ERR)); console.log('wrote', OUT); });
