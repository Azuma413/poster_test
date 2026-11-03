// Builds the CoRL 2026 poster (48 x 23 in, print at 200 % => 96 x 46 in).
// Usage: node build.js <assets_dir> <out.pptx>   (then: python fix_pptx.py <out.pptx>)
// Body text >= 28 pt; text inside figures/charts >= 20 pt (key labels larger); references 16 pt;
// citation marks [n] are two steps smaller than the surrounding text (28 -> 20, 24 -> 18, 20 -> 16).
const pptxgen = require('pptxgenjs');
const path = require('path');
const [, , ASSETS, OUT] = process.argv;
const A = (n) => path.join(ASSETS, n);

const pres = new pptxgen();
pres.defineLayout({ name: 'POSTER', width: 48, height: 23 });
pres.layout = 'POSTER';
pres.author = 'Kaneyoshi Hiratsuka';
pres.title = 'S2A2: Audio-Visual Imitation Learning for Manipulation Tasks Using Acoustic Spatial Information';

// ---------- palette (blue family) ----------------------------------------------
const NAVY = '14305E', BLUE = '2C5AA0', SKY = 'DCE9F8', BG = 'E8EEF6', TXT = '1A1A1A', MUTED = '4A5568';
const ORANGE = 'D9622B', ORANGE_L = 'FCE4D4', GREEN = '3C8D40', GREEN_L = 'DDEFD9', GREY_L = 'E6EAF0';
const SER = { base: '9DB9DB', s2a2: '14305E', spec: 'E8A33D', spat: '5BA85A' };
const FONT = 'Arial';

// ---------- references (only the ones the poster really needs) -----------------
const REF = {
  playitbyear: 1, maniwav: 2, audiovla: 3, aslip: 4, music: 5, spotforming: 6, act: 7, dp: 8, vqbet: 9, pi0: 10,
};
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
// citation run: two steps smaller than the surrounding text
const cite = (keys, base, extra) => ({ text: ' [' + [].concat(keys).map((k) => REF[k]).join(', ') + ']', options: Object.assign({ fontSize: base >= 28 ? base - 8 : Math.max(16, base - 6) }, extra || {}) });

const slide = pres.addSlide();
slide.background = { color: BG };

// ---------- helpers --------------------------------------------------------------
function text(t, o) {
  slide.addText(t, Object.assign({ fontFace: FONT, color: TXT, isTextBox: true, margin: 0, valign: 'top' }, o));
}
function panel(x, y, w, h, title) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: 'FFFFFF' }, line: { color: BLUE, width: 1.5 }, rectRadius: 0.15 });
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.85, fill: { color: NAVY }, line: { color: NAVY, width: 0 }, rectRadius: 0.15 });
  slide.addShape(pres.ShapeType.rect, { x, y: y + 0.42, w, h: 0.43, fill: { color: NAVY }, line: { color: NAVY, width: 0 } });
  text(title, { x: x + 0.3, y, w: w - 0.6, h: 0.85, fontSize: 40, bold: true, color: 'FFFFFF', valign: 'middle' });
  return { x: x + 0.3, y: y + 1.0, w: w - 0.6, h: h - 1.15, bottom: y + h - 0.15 };
}
// bullet list; items = array of (string | array of (string | run))
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
  text(t, Object.assign({ x, y, w, h, fontSize: 22, align: 'center', valign: 'middle', bold: true, color: NAVY }, o || {}));
}
function captioned(name, x, y, w, h, cap, o) {
  img(name, x, y, w, h);
  label(cap, x, y + h + 0.02, w, 0.4, Object.assign({ fontSize: 20, color: MUTED, bold: false }, o || {}));
}
// numbered circle marker (array index) — white disc, black ring, bold number
function marker(n, cx, cy, d, o) {
  slide.addShape(pres.ShapeType.ellipse, { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color: (o && o.fill) || 'FFFFFF' }, line: { color: (o && o.line) || '000000', width: 1.5 } });
  text(String(n), { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fontSize: (o && o.fontSize) || 20, bold: true, color: (o && o.color) || '000000', align: 'center', valign: 'middle' });
}
const chartBase = {
  barDir: 'col', barGrouping: 'clustered',
  chartColors: [SER.base, SER.s2a2, SER.spec, SER.spat],
  titleFontSize: 24, titleFontFace: FONT, titleColor: NAVY, titleBold: true,
  catAxisLabelFontSize: 22, catAxisLabelFontFace: FONT, catAxisLabelColor: TXT,
  valAxisLabelFontSize: 20, valAxisLabelFontFace: FONT, valAxisLabelColor: TXT,
  valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25,
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

// ============================ HEADER ==============================================
const HH = 3.0;
slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 48, h: HH, fill: { color: NAVY }, line: { color: NAVY, width: 0 } });
slide.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 0.3, w: 7.4, h: 2.4, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF', width: 0 }, rectRadius: 0.15 });
img('kyoto.png', 0.55, 0.4, 2.2, 2.2);
img('riken.png', 3.0, 0.45, 3.6, 1.1);
img('mmai.png', 3.3, 1.65, 3.0, 1.0);
img('corl_logo.png', 42.2, 0.12, 4.8, 2.4);
text('Austin, TX · 2026', { x: 41.5, y: 2.5, w: 6.2, h: 0.45, fontSize: 28, color: 'FFFFFF', align: 'center', valign: 'middle' });

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
const BG_H = 8.9, FW_H = 8.35, CC_H = 4.2, CT_H = 5.3, RR_H = YEND - Y0 - CC_H - CT_H - 2 * GAP;
const ERR = {};   // chart title -> per-series STD, injected as error bars by fix_pptx.py

// ============================ LEFT: BACKGROUND ====================================
{
  const p = panel(LX, Y0, LW, BG_H, 'Background');
  const ih = 3.15, iw = ih * 1.5;              // illustration, 3:2 crop as in the previous poster
  const tw = p.w - iw - 0.35;
  bullets([
    ['Vision-only policies fail when objects ', B('look identical'), ' or their state is ', B('hidden'), cite(['playitbyear', 'maniwav'], 28), '.'],
    ['Sound tells ', C('WHERE'), ' a source is and ', C('WHAT'), ' it is.'],
    ['Existing audio policies use only ', B('spectral'), ' cues; ', B('acoustic spatial'), ' cues have not been given to a manipulation policy', cite(['playitbyear', 'maniwav', 'audiovla'], 28), '.'],
  ], { x: p.x, y: p.y, w: tw, h: ih + 0.45 });
  captioned('bg_sort.jpg', p.x + tw + 0.35, p.y, iw, ih, 'Sort by acoustic cues');
  // comparison with prior work
  const ty = p.y + ih + 0.65;
  const cell = (t, o) => ({ text: t, options: Object.assign({ fontFace: FONT, fontSize: 24, align: 'center', valign: 'middle', color: TXT, margin: 0.04 }, o || {}) });
  const hdr = (t, col) => cell(t, { bold: true, color: 'FFFFFF', fill: { color: col } });
  const lab = (t, f) => ({ text: t, options: Object.assign({ fontFace: FONT, fontSize: 24, align: 'left', valign: 'middle', bold: true, color: NAVY, margin: [0.04, 0.04, 0.04, 0.12] }, f) });
  const labc = (t, key, f) => ({ text: [{ text: t, options: { align: 'left', fontSize: 24 } }, { text: ' [' + REF[key] + ']', options: { align: 'left', fontSize: 18 } }], options: Object.assign({ fontFace: FONT, fontSize: 24, align: 'left', valign: 'middle', bold: true, color: NAVY, margin: [0.04, 0.04, 0.04, 0.12] }, f) });
  const yes = (col, f) => cell('✓', Object.assign({ bold: true, color: col, fontSize: 30 }, f));
  const no = (f) => cell('–', Object.assign({ color: 'A0A8B8', fontSize: 30 }, f));
  const alt = { fill: { color: 'EEF3FA' } }, ours = { fill: { color: SKY } };
  const rows = [
    [hdr('', NAVY), hdr('Robot\npolicy', NAVY), hdr('Acoustic\nspatial info', ORANGE), hdr('Spectral\ninfo', GREEN)],
    [labc('Audio-VLA', 'audiovla', alt), yes(NAVY, alt), no(alt), yes(GREEN, alt)],
    [labc('A-SLIP', 'aslip', {}), no({}), yes(ORANGE, {}), yes(GREEN, {})],
    [lab('S2A2 (ours)', Object.assign({ color: BLUE }, ours)), yes(NAVY, ours), yes(ORANGE, ours), yes(GREEN, ours)],
  ];
  slide.addTable(rows, { x: p.x, y: ty, w: p.w, colW: [4.5, 3.1, 3.1, 3.1], rowH: [0.8, 0.62, 0.62, 0.62], border: { type: 'solid', color: 'C9D3E3', pt: 1 }, fontFace: FONT });
  bullets([
    [C('→ S2A2: '), 'the first manipulation policy that ', B('explicitly'), ' uses acoustic spatial (', C('WHERE'), ') and spectral (', C('WHAT'), ') information.'],
  ], { x: p.x, y: ty + 2.66 + 0.15, w: p.w, h: p.bottom - (ty + 2.81), nobullet: true });
}

// ============================ LEFT: TASKS =========================================
const CAP = { WHERE: [ORANGE, ORANGE_L], WHAT: [GREEN, GREEN_L], EXPLORE: [BLUE, SKY] };
{
  const PY = Y0 + BG_H + GAP;
  const p = panel(LX, PY, LW, YEND - PY, 'Acoustic-aware Manipulation Tasks');
  bullets([
    ['Four ', B('diagnostic tasks'), ' that isolate ', C('localization'), ', ', C('identification'), ' and ', C('exploration'), '. Goal: grasp the right object, drop it into the right box.'],
  ], { x: p.x, y: p.y, w: p.w, h: 1.1 });
  const cards = [
    { icon: 'icon_L.png', shot: 'task_L.png', title: 'Localization', need: ['WHERE'],
      pts: ['2 look-alikes, 1 box', 'One emits a sound', 'Carry the sounder'] },
    { icon: 'icon_I.png', shot: 'task_I.png', title: 'Identification', need: ['WHAT'],
      pts: ['1 object, 2 boxes', 'It emits sound A or B', 'Box chosen by timbre'] },
    { icon: 'icon_LI.png', shot: 'task_LI.png', title: 'L&I', need: ['WHERE', 'WHAT'],
      pts: ['2 look-alikes, 2 boxes', 'One emits A or B', 'Find it, box by timbre'] },
    { icon: 'icon_Ex.png', shot: 'task_Ex.png', title: 'Exploratory', need: ['WHERE', 'WHAT', 'EXPLORE'],
      pts: ['2 look-alikes, 1 box', 'One sounds only when moved', 'Lift & shake to find it'] },
  ];
  const cw = (p.w - 0.3) / 2, cy0 = p.y + 1.2;
  const ch = (p.bottom - cy0 - 0.25) / 2;
  const rightW = 1.95, iconH = rightW * 695 / 1200;
  cards.forEach((c, i) => {
    const cx = p.x + (i % 2) * (cw + 0.3), cy = cy0 + Math.floor(i / 2) * (ch + 0.25);
    const lw = cw - rightW - 0.45, rx = cx + cw - rightW - 0.15;
    box(cx, cy, cw, ch, 'F7F9FC', BLUE);
    text(c.title, { x: cx + 0.25, y: cy + 0.12, w: lw, h: 0.55, fontSize: 32, bold: true, color: NAVY, valign: 'middle' });
    let px = cx + 0.25;
    c.need.forEach((n) => {
      const pw = n.length * 0.17 + 0.35, [fg, bg] = CAP[n];
      box(px, cy + 0.74, pw, 0.42, bg, bg, 0.1);
      text(n, { x: px, y: cy + 0.74, w: pw, h: 0.42, fontSize: 20, bold: true, color: fg, align: 'center', valign: 'middle' });
      px += pw + 0.1;
    });
    img(c.icon, rx, cy + 0.12, rightW, iconH);
    const shot = 1.8;
    img(c.shot, rx + (rightW - shot) / 2, cy + ch - shot - 0.15, shot, shot);
    bullets(c.pts, { x: cx + 0.25, y: cy + 1.35, w: lw, h: ch - 1.4, gap: 2 });
  });
}

// ============================ MIDDLE: FRAMEWORK ===================================
{
  const p = panel(MX, Y0, MW, FW_H, 'S2A2 Framework: Spatial-Spectral Audio Action');
  bullets([
    [C('Key idea: '), 'explicit ', B('acoustic spatial map'), ' (', C('WHERE'), ') + ', B('spectrogram'), ' (', C('WHAT'), ') + vision → policy'],
  ], { x: p.x, y: p.y, w: p.w, h: 0.55, nobullet: true });
  const dy = p.y + 0.6, dh = p.bottom - dy;
  // columns: Environment | Processing Pipelines | Multimodal Policy | Tasks
  const envX = p.x, envW = 3.2, pipX = envX + envW + 0.3, pipW = 8.0;
  const mpX = pipX + pipW + 0.3, catW = 0.9, polW = 1.7, mpW = catW + 0.35 + polW;
  const tskX = mpX + mpW + 0.3, tskW = p.x + p.w - tskX;
  label('Environment', envX, dy, envW, 0.45, { fontSize: 24 });
  label('Processing Pipelines', pipX, dy, pipW, 0.45, { fontSize: 24 });
  label('Multimodal Policy', mpX, dy, mpW, 0.45, { fontSize: 24 });
  label('Tasks', tskX, dy, tskW, 0.45, { fontSize: 24 });
  const by = dy + 0.5, bh = dh - 0.5;

  // ---- Environment (real robot): camera, top-down photo, microphone arrays
  box(envX, by, envW, bh, GREY_L, GREY_L);
  img('icon_cam.png', envX + 0.2, by + 0.15, 0.7, 0.7);
  label('RGB\nCamera', envX + 1.0, by + 0.08, envW - 1.1, 0.85, { align: 'left', fontSize: 22 });
  const envImW = envW - 0.3, envImH = envImW * 1479 / 2423, envImY = by + 1.05;
  img('env_crop.jpg', envX + 0.15, envImY, envImW, envImH);
  const micY = envImY + envImH + 0.15;
  img('icon_mic.png', envX + 0.2, micY, 0.7, 0.7);
  label('Microphone\nArrays', envX + 1.0, micY - 0.07, envW - 1.1, 0.85, { align: 'left', fontSize: 22 });
  label('Ambiguous visuals', envX, by + bh - 0.42, envW, 0.4, { fontSize: 20, color: MUTED, bold: false });

  // ---- three pipeline rows: title band (right-aligned) + images + note beside + encoder
  const rowGap = 0.12, rowH = (bh - 2 * rowGap) / 3;
  const encW = 1.6, encX = pipX + pipW - encW - 0.15;
  const ih = rowH - 0.62;                          // image size
  const im1 = pipX + 0.3, im2 = im1 + ih + 0.6;     // two image slots
  const rows = [
    { fill: 'EAF1FA', lc: BLUE, enc: 'Vision\nEncoder', encFill: SKY,
      title: [{ text: 'RGB Image' }] },
    { fill: ORANGE_L, lc: ORANGE, enc: 'Spatial\nEncoder', encFill: 'F6C6A8',
      title: [{ text: 'Acoustic Spatial Map' }, { text: ' — localization by MUSIC', options: { bold: false } }, cite('music', 22, { bold: false })] },
    { fill: GREEN_L, lc: GREEN, enc: 'Spectral\nEncoder', encFill: 'BFE0BA',
      title: [{ text: 'Spectrogram' }, { text: ' — Spotforming', options: { bold: false } }, cite('spotforming', 22, { bold: false }), { text: ' at ★', options: { bold: false } }] },
  ];
  const rowTop = [], rowMid = [];
  rows.forEach((r, i) => {
    const ry = by + i * (rowH + rowGap);
    rowTop.push(ry);
    box(pipX, ry, pipW, rowH, r.fill, r.lc);
    label(r.title, pipX + 0.2, ry + 0.05, pipW - 0.4, 0.45, { fontSize: 22, color: r.lc, align: 'right' });
    const iy = ry + 0.52;
    rowMid.push(iy + ih / 2);
    box(encX, iy, encW, ih, r.encFill, r.lc);
    label(r.enc, encX, iy, encW, ih, { fontSize: 22, color: TXT });
    arrow(encX - 0.5, iy + ih / 2, encX - 0.05, iy + ih / 2, r.lc, 2.5);
  });
  const noteX = im2 + ih + 0.2, noteW = encX - 0.55 - noteX;
  // row 0: RGB image — real top-down + wrist camera
  {
    const iy = rowTop[0] + 0.52;
    img('cam_top_small.png', im1, iy, ih, ih);
    img('cam_wrist.png', im2, iy, ih, ih);
    label('top-down and\nwrist cameras', noteX, iy, noteW, ih, { fontSize: 20, bold: false, color: MUTED, align: 'left' });
  }
  // row 1: acoustic spatial map — numbered arrays on the photo map onto the same corners of the map
  const mapY1 = rowTop[1] + 0.52;
  {
    const iy = mapY1;
    img('env_crop.jpg', im1, iy, ih, ih, { sizing: { type: 'cover', w: ih, h: ih } });
    img('spatial_map.png', im2, iy, ih, ih);
    const d = 0.36, corners = [[2, 0.14, 0.14], [3, 0.86, 0.14], [1, 0.14, 0.86], [4, 0.86, 0.86]];
    corners.forEach(([n, fx, fy]) => { marker(n, im1 + fx * ih, iy + fy * ih, d); marker(n, im2 + fx * ih, iy + fy * ih, d); });
    arrow(im1 + ih + 0.08, iy + ih / 2, im2 - 0.08, iy + ih / 2, ORANGE, 2.5);
    label('likelihood of the\nsource position\n(①–④: same\narray layout)', noteX, iy - 0.1, noteW, ih + 0.2, { fontSize: 20, bold: false, color: MUTED, align: 'left' });
  }
  // row 2: spectrogram — Spotforming at the peak (★) of the spatial map
  {
    const iy = rowTop[2] + 0.52;
    img('spatial_map.png', im1, iy, ih, ih);
    slide.addShape(pres.ShapeType.star5, { x: im1 + 0.656 * ih - 0.19, y: iy + 0.281 * ih - 0.19, w: 0.38, h: 0.38, fill: { color: 'FFE000' }, line: { color: '000000', width: 1 } });
    arrow(im1 + ih + 0.08, iy + ih / 2, im2 - 0.08, iy + ih / 2, GREEN, 2.5);
    img('real_spec.png', im2, iy, ih, ih);
    label('separated\nsound at ★\n(beamforming\n+ NMF)', noteX, iy - 0.1, noteW, ih + 0.2, { fontSize: 20, bold: false, color: MUTED, align: 'left' });
    // map (row 1) -> map with peak (row 2): down, left along the title band, down
    const x1 = im2 + ih / 2, x2 = im1 + ih / 2, yb = rowTop[2] - rowGap / 2;
    line(x1, mapY1 + ih, x1, yb, ORANGE, 2.5);
    line(x1, yb, x2, yb, ORANGE, 2.5);
    arrow(x2, yb, x2, iy - 0.02, ORANGE, 2.5);
  }
  // environment -> pipelines: camera (blue) to row 0, microphone bus (green) to rows 1 and 2
  arrow(envX + envW, by + 0.5, pipX, rowMid[0], BLUE, 2.5);
  const busX = envX + envW + 0.15, mY = micY + 0.35;
  line(envX + envW, mY, busX, mY, GREEN, 2.5);
  line(busX, rowMid[1], busX, rowMid[2], GREEN, 2.5);
  arrow(busX, rowMid[1], pipX, rowMid[1], GREEN, 2.5);
  arrow(busX, rowMid[2], pipX, rowMid[2], GREEN, 2.5);

  // ---- multimodal policy: feature concat + policy network
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
    { text: '✓ π0' }, cite('pi0', 22, { breakLine: true }),
    { text: '\n→ action', options: { color: MUTED, fontSize: 20 } },
  ], { x: polX + 0.08, y: catY + 0.05, w: polW - 0.16, h: catH - 0.1, fontSize: 22, align: 'left', valign: 'middle', lineSpacingMultiple: 1.0 });
  arrow(catX + catW, by + bh / 2, polX, by + bh / 2, NAVY, 3);

  // ---- tasks (real robot photos)
  box(tskX, by, tskW, bh, 'F3E3F5', 'F3E3F5');
  const tiw = tskW - 0.2, tih = tiw * 0.75;
  img('photo_li.jpg', tskX + 0.1, by + 0.1, tiw, tih);
  label('Localization &\nidentification', tskX - 0.2, by + 0.12 + tih, tskW + 0.4, 0.7, { fontSize: 20 });
  img('photo_ex.jpg', tskX + 0.1, by + 0.95 + tih, tiw, tih);
  label('Exploratory\nbehavior', tskX - 0.2, by + 0.97 + 2 * tih, tskW + 0.4, 0.7, { fontSize: 20 });
  arrow(polX + polW, by + bh / 2, tskX, by + bh / 2, NAVY, 3);
}

// ============================ MIDDLE: SIMULATION ==================================
{
  const PY = Y0 + FW_H + GAP;
  const p = panel(MX, PY, MW, YEND - PY, 'Simulation Results');
  // --- setup: top-down diagram with the 4 arrays on a circle and both cameras (as in Fig. 2)
  const dH = 2.15, dW = dH * 456 / 400, dx = p.x, dyy = p.y + 0.1;
  img('sim_topdown.png', dx, dyy, dW, dH);
  const ccx = dx + dW * 0.595, ccy = dyy + dH * 0.5, cr = dH * 0.33;   // workspace centre and the 300 mm circle
  slide.addShape(pres.ShapeType.ellipse, { x: ccx - cr, y: ccy - cr, w: 2 * cr, h: 2 * cr, fill: { type: 'none' }, line: { color: '000000', width: 2, dashType: 'dash' } });
  [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4].forEach((a) => {
    const mx = ccx + cr * Math.cos(a), my = ccy - cr * Math.sin(a), d = 0.34;
    slide.addShape(pres.ShapeType.octagon, { x: mx - d / 2, y: my - d / 2, w: d, h: d, fill: { color: 'FFC000' }, line: { color: 'B08000', width: 1 } });
  });
  img('icon_cam.png', dx + dW * 0.56 - 0.25, dyy - 0.08, 0.5, 0.5);
  label('side cam.', dx + dW * 0.56 + 0.28, dyy - 0.08, 1.5, 0.5, { fontSize: 20, align: 'left' });
  img('icon_cam.png', dx + dW + 0.08, ccy - 0.25, 0.5, 0.5);
  label('front\ncam.', dx + dW + 0.08, ccy + 0.25, 1.0, 0.65, { fontSize: 20, align: 'left' });
  slide.addShape(pres.ShapeType.octagon, { x: dx, y: dyy + dH + 0.1, w: 0.28, h: 0.28, fill: { color: 'FFC000' }, line: { color: 'B08000', width: 1 } });
  label(': mic array', dx + 0.33, dyy + dH + 0.05, dW, 0.38, { fontSize: 20, bold: false, color: MUTED, align: 'left' });
  const sx = dx + dW + 1.25;
  bullets([
    [B('Genesis'), ' (physics) + ', B('Pyroomacoustics'), ' (acoustics); Franka Panda'],
    [B('4 microphone arrays'), ' on a ', B('300 mm circle'), ' around the workspace centre (500 mm ahead), 10 FPS'],
    [B('Front + side cameras'), ', 224×224 RGB, 30 FPS'],
    ['100 / 200 demos per task; success rate over ', B('100 trials × 3 seeds')],
  ], { x: sx, y: p.y, w: p.x + p.w - sx, h: dH + 0.5, gap: 1 });
  // --- legend + 4 charts
  const ly = p.y + dH + 0.6;
  legendRow(p.x + 0.2, ly, [['Baseline (RGB only)', SER.base], ['S2A2 (ours)', SER.s2a2], ['w/o Spec. (no spectrogram)', SER.spec], ['w/o Spat. (no spatial map)', SER.spat]]);
  const cats = ['ACT', 'DP', 'VQ-BeT', 'π0'];
  // mean and STD over 3 seeds (Table 2 of the paper)
  const sim = {
    'Localization':   { base: [20.3, 13.3, 12.7, 18.3], s2a2: [73.0, 68.0, 40.3, 32.0], spec: [74.7, 68.3, 44.7, 17.3], spat: [15.3, 15.3, 12.3, 14.7],
                        sd: [[7.2, 1.2, 6.8, 2.3], [5.6, 3.6, 4.5, 9.9], [4.7, 13.7, 5.5, 5.0], [4.0, 1.2, 3.8, 5.7]] },
    'Identification': { base: [39.3, 41.3, 24.0, 32.3], s2a2: [76.7, 67.7, 32.3, 73.3], spec: [44.3, 32.7, 32.7, 40.0], spat: [74.3, 80.3, 49.3, 78.7],
                        sd: [[4.0, 2.5, 6.9, 2.1], [1.2, 7.2, 10.0, 8.4], [2.3, 3.1, 3.1, 11.4], [7.0, 3.8, 9.8, 6.0]] },
    'L&I':            { base: [11.0, 9.3, 7.7, 7.0],    s2a2: [78.7, 89.7, 55.3, 45.7], spec: [45.0, 46.0, 32.3, 14.3], spat: [25.7, 8.7, 19.0, 19.7],
                        sd: [[3.5, 6.1, 1.2, 4.0], [2.1, 2.1, 11.7, 8.1], [3.6, 5.3, 7.5, 2.9], [3.1, 3.8, 1.0, 3.8]] },
    'Exploratory':    { base: [35.0, 26.3, 17.3, 9.0],  s2a2: [77.3, 44.0, 32.7, 18.7], spec: [75.3, 37.3, 20.0, 26.7], spat: [72.3, 6.3, 25.0, 9.3],
                        sd: [[5.3, 0.6, 5.8, 1.0], [5.7, 3.6, 12.7, 4.2], [5.0, 8.1, 20.0, 3.2], [8.4, 2.3, 3.6, 10.4]] },
  };
  const cy0 = ly + 0.6, chH = 2.6, chW = (p.w - 0.45) / 4;
  Object.entries(sim).forEach(([name, d], i) => {
    const cx = p.x + i * (chW + 0.15);
    ERR[name + ' task'] = d.sd;
    slide.addChart(pres.ChartType.bar, [
      { name: 'Baseline', labels: cats, values: d.base },
      { name: 'S2A2', labels: cats, values: d.s2a2 },
      { name: 'w/o Spec.', labels: cats, values: d.spec },
      { name: 'w/o Spat.', labels: cats, values: d.spat },
    ], Object.assign({}, chartBase, { x: cx, y: cy0, w: chW, h: chH, barGapWidthPct: 40, showTitle: true, title: name + ' task', showLegend: false }));
  });
  const hx = p.x + 2 * (chW + 0.15);
  slide.addShape(pres.ShapeType.roundRect, { x: hx - 0.05, y: cy0 - 0.05, w: chW + 0.1, h: chH + 0.45, fill: { type: 'none' }, line: { color: ORANGE, width: 4 }, rectRadius: 0.12 });
  label('★ S2A2 best, all 4 policies', hx, cy0 + chH, chW, 0.38, { fontSize: 20, color: ORANGE });
  label('map ≫ raw audio: 73 vs 43 %', p.x, cy0 + chH, chW, 0.38, { fontSize: 20, color: ORANGE });
  label('error bars: ± STD over 3 seeds', p.x + 3 * (chW + 0.15), cy0 + chH, chW, 0.38, { fontSize: 20, color: MUTED, bold: false });
  // --- t-SNE latent space (Fig. 4a)
  const ty = cy0 + chH + 0.55, th = p.bottom - ty;
  label('Latent space of Diffusion Policy on the L&I task (t-SNE)', p.x, ty, p.w, 0.4, { fontSize: 24, align: 'left' });
  const conds = ['Baseline', 'S2A2', 'w/o\nSpec.', 'w/o\nSpat.'];
  const hdrH = 0.62, rowLblW = 1.45, ph = (th - 0.45 - hdrH - 0.1) / 2, pw = ph * 755 / 907;
  conds.forEach((c, j) => label(c, p.x + rowLblW + j * (pw + 0.1) - 0.1, ty + 0.42, pw + 0.2, hdrH, { fontSize: 20, color: j === 1 ? NAVY : MUTED, valign: 'bottom' }));
  const rowY = [0, 1].map((i) => ty + 0.45 + hdrH + i * (ph + 0.1));
  ['Sound\ntype', 'Source\nY-coord.'].forEach((r, i) => {
    label(r, p.x, rowY[i], rowLblW - 0.1, ph, { fontSize: 20, align: 'right', color: MUTED });
    conds.forEach((c, j) => img(`tsne_r${i}_c${j}.png`, p.x + rowLblW + j * (pw + 0.1), rowY[i], pw, ph));
  });
  const sxx = p.x + rowLblW + (pw + 0.1) - 0.06;
  slide.addShape(pres.ShapeType.roundRect, { x: sxx, y: rowY[0] - 0.06, w: pw + 0.12, h: 2 * ph + 0.22, fill: { type: 'none' }, line: { color: ORANGE, width: 4 }, rectRadius: 0.08 });
  const kx = p.x + rowLblW + 4 * (pw + 0.1) + 0.15;
  slide.addShape(pres.ShapeType.rect, { x: kx, y: rowY[0] + 0.06, w: 0.34, h: 0.34, fill: { color: 'FF7F0E' }, line: { color: 'FF7F0E', width: 0 } });
  label('sound A', kx + 0.42, rowY[0] - 0.02, 1.4, 0.5, { fontSize: 20, bold: false, align: 'left', color: TXT });
  slide.addShape(pres.ShapeType.rect, { x: kx, y: rowY[0] + 0.5, w: 0.34, h: 0.34, fill: { color: '1F77B4' }, line: { color: '1F77B4', width: 0 } });
  label('sound B', kx + 0.42, rowY[0] + 0.42, 1.4, 0.5, { fontSize: 20, bold: false, align: 'left', color: TXT });
  img('tsne_cbar.png', kx, rowY[1], 0.3, ph);
  label('+0.3', kx + 0.38, rowY[1] - 0.05, 1.0, 0.3, { fontSize: 20, bold: false, align: 'left', color: TXT });
  label('0', kx + 0.38, rowY[1] + ph / 2 - 0.15, 1.0, 0.3, { fontSize: 20, bold: false, align: 'left', color: TXT });
  label('−0.3 m', kx + 0.38, rowY[1] + ph - 0.25, 1.4, 0.3, { fontSize: 20, bold: false, align: 'left', color: TXT });
  const tx = kx + 1.8;
  bullets([
    ['Color = sound type (top) or Y-coordinate of the sounding object (bottom).'],
    [B('S2A2'), ' separates ', C('both'), ' cues; w/o Spat. loses position, w/o Spec. loses timbre → the two acoustic cues play ', B('independent roles'), '.'],
  ], { x: tx, y: ty + 0.45, w: p.x + p.w - tx, h: th - 0.45, gap: 4, nobullet: true });
}

// ============================ RIGHT: REAL ROBOT ===================================
{
  const p = panel(RX, Y0, RW, RR_H, 'Real Robot Results');
  const ph = 2.6, pw = ph / 0.625;
  captioned('real_env.jpg', p.x, p.y, pw, ph, 'Top-down view, 4 mic arrays');
  bullets([
    ['ILOHA arm (ALOHA-type', cite('act', 28), '): 6 joints + gripper'],
    ['4 TAMAGO-03 arrays (8 ch, 16 kHz) at the corners of a 1.2 × 0.6 m rectangle'],
    ['Top-down + wrist RGB (224×224)'],
    [B('ACT'), '; 100 teleop demos per task; 100 trials'],
  ], { x: p.x + pw + 0.3, y: p.y, w: p.w - pw - 0.3, h: ph + 0.45, gap: 1 });
  const cy = p.y + ph + 0.55, ch = p.bottom - cy - 1.05, cw = 6.2;
  slide.addChart(pres.ChartType.bar, [
    { name: 'Baseline', labels: ['L&I', 'Exploratory'], values: [5, 12] },
    { name: 'S2A2', labels: ['L&I', 'Exploratory'], values: [72, 50] },
    { name: 'w/o Spec.', labels: ['L&I', 'Exploratory'], values: [18, 33] },
    { name: 'w/o Spat.', labels: ['L&I', 'Exploratory'], values: [3, 27] },
  ], Object.assign({}, chartBase, {
    x: p.x, y: cy, w: cw, h: ch, barGapWidthPct: 35,
    showTitle: true, title: 'Success rate (%), 100 trials',
    showLegend: true, legendPos: 'r', legendFontSize: 20, legendFontFace: FONT, legendColor: TXT,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0',
  }));
  // sequence figure: title / image / caption stacked with fixed gaps, vertically centred beside the chart
  const sx = p.x + cw + 0.3, sw = p.w - cw - 0.3, sh = sw * 704 / 1452;
  const titleH = 0.45, capH = 0.75, blockH = titleH + 0.05 + sh + 0.05 + capH;
  const sy = cy + Math.max(0, (ch + 1.05 - blockH) / 2);
  label('S2A2 + ACT on the exploratory task  (time →)', sx, sy, sw, titleH, { fontSize: 22 });
  img('real_seq.png', sx, sy + titleH + 0.05, sw, sh);
  label('Top: robot.  Middle: acoustic spatial map on the top-down view.  Bottom: spectrogram.', sx, sy + titleH + 0.1 + sh, sw, capH, { fontSize: 20, color: MUTED, bold: false });
  bullets([
    [B('S2A2 wins both tasks'), '; spatial + spectral > either alone.'],
  ], { x: p.x, y: p.bottom - 1.0, w: cw, h: 1.0, nobullet: true });
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
