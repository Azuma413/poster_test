// Builds the CoRL 2026 poster (48 x 23 in, print at 200 % => 96 x 46 in).
// Usage: node build.js <assets_dir> <out.pptx>   (then: python fix_pptx.py <out.pptx>)
// Body text >= 28 pt, text inside figures/charts >= 20 pt, references 16 pt.
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
const LH = 0.49;   // line height of 28 pt text (in)

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
function line(x1, y1, x2, y2, color, width) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  slide.addShape(pres.ShapeType.line, { x, y, w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH: x2 < x1, flipV: y2 < y1, line: { color: color || NAVY, width: width || 3 } });
}
function box(x, y, w, h, fill, lineColor, radius) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: lineColor || fill, width: 1.5 }, rectRadius: radius == null ? 0.12 : radius });
}
function label(t, x, y, w, h, o) {
  text(t, Object.assign({ x, y, w, h, fontSize: 22, align: 'center', valign: 'middle', bold: true, color: NAVY }, o || {}));
}
// image with a centred caption of the same width directly below it
function captioned(name, x, y, w, h, cap, o) {
  img(name, x, y, w, h);
  label(cap, x, y + h + 0.02, w, 0.4, Object.assign({ fontSize: 20, color: MUTED, bold: false }, o || {}));
}
const chartBase = {
  barDir: 'col', barGrouping: 'clustered',
  chartColors: [SER.base, SER.s2a2, SER.spec, SER.spat],
  titleFontSize: 22, titleFontFace: FONT, titleColor: NAVY, titleBold: true,
  catAxisLabelFontSize: 20, catAxisLabelFontFace: FONT, catAxisLabelColor: TXT,
  valAxisLabelFontSize: 20, valAxisLabelFontFace: FONT, valAxisLabelColor: TXT,
  valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25,
  valGridLine: { color: 'D0D7E2', size: 1 }, catGridLine: { style: 'none' },
  catAxisLineShow: true, valAxisLineShow: false,
  plotArea: { fill: { color: 'FFFFFF' } },
  dataLabelFontSize: 20, dataLabelFontFace: FONT, dataLabelColor: TXT,
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
slide.addShape(pres.ShapeType.roundRect, { x: 40.9, y: 0.3, w: 6.7, h: 2.4, fill: { color: '000000' }, line: { color: '000000', width: 0 }, rectRadius: 0.15 });
img('corl_logo.png', 41.25, 0.32, 6.0, 1.9 * 0.95);
text('Austin, TX · 2026', { x: 40.9, y: 2.15, w: 6.7, h: 0.5, fontSize: 28, color: 'FFFFFF', align: 'center', valign: 'middle' });

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
const BG_H = 5.6, FW_H = 7.4, RR_H = 8.5, CC_H = 4.2;

// ============================ LEFT: BACKGROUND ====================================
{
  const p = panel(LX, Y0, LW, BG_H, 'Background');
  const ih = 3.2, iw = ih * 1.5;               // illustration, 3:2 crop as in the previous poster
  const tw = p.w - iw - 0.35;
  bullets([
    ['Vision-only policies fail when objects ', B('look identical'), ' or their state is ', B('hidden'), ' [1, 2].'],
    ['Sound carries two complementary cues: ', C('WHERE'), ' the source is and ', C('WHAT'), ' it is [3].'],
    ['Prior audio imitation learning feeds only spectrograms or raw waveforms, so the ', B('source position stays implicit'), ' [1, 2, 4].'],
  ], { x: p.x, y: p.y, w: tw, h: p.h });
  captioned('bg_sort.jpg', p.x + tw + 0.35, p.y + (p.h - ih - 0.45) / 2, iw, ih, 'Sort by acoustic cues');
}

// ============================ LEFT: TASKS =========================================
{
  const PY = Y0 + BG_H + GAP;
  const p = panel(LX, PY, LW, YEND - PY, 'Acoustic-aware Manipulation Tasks');
  bullets([
    ['Four ', B('diagnostic tasks'), ' that isolate ', C('localization'), ', ', C('identification'), ' and ', C('exploration'), '. Goal: grasp the right object, drop it into the right box.'],
  ], { x: p.x, y: p.y, w: p.w, h: 1.1 });
  const cards = [
    { icon: 'icon_L.png', title: 'Localization', need: 'WHERE', fill: ORANGE_L, lc: ORANGE,
      pts: ['2 identical objects, one emits sound', 'Transport the sounding one'] },
    { icon: 'icon_I.png', title: 'Identification', need: 'WHAT', fill: GREEN_L, lc: GREEN,
      pts: ['1 object emits sound A or B', 'Destination box depends on the timbre'] },
    { icon: 'icon_LI.png', title: 'L&I', need: 'WHERE + WHAT', fill: SKY, lc: BLUE,
      pts: ['2 identical objects, one emits A or B', 'Pick the sounding one, box by timbre'] },
    { icon: 'icon_Ex.png', title: 'Exploratory', need: 'WHERE + WHAT + EXPLORE', fill: SKY, lc: BLUE,
      pts: ['Silent at rest, one sounds when moved', 'Lift and shake each, place the sounding one'] },
  ];
  const tableH = 5 * 0.5, cw = (p.w - 0.3) / 2, cy0 = p.y + 1.2;
  const ch = (p.bottom - tableH - 0.35 - cy0 - 0.25) / 2;
  cards.forEach((c, i) => {
    const cx = p.x + (i % 2) * (cw + 0.3), cy = cy0 + Math.floor(i / 2) * (ch + 0.25);
    const iconW = 2.45, iconH = iconW * 695 / 1200;
    box(cx, cy, cw, ch, 'F7F9FC', c.lc);
    text(c.title, { x: cx + 0.25, y: cy + 0.12, w: cw - iconW - 0.6, h: 0.55, fontSize: 32, bold: true, color: NAVY, valign: 'middle' });
    box(cx + 0.25, cy + 0.75, cw - iconW - 0.6, 0.5, c.fill, c.fill, 0.08);
    text('needs: ' + c.need, { x: cx + 0.25, y: cy + 0.75, w: cw - iconW - 0.6, h: 0.5, fontSize: 20, bold: true, color: c.lc, align: 'center', valign: 'middle' });
    img(c.icon, cx + cw - iconW - 0.15, cy + 0.12, iconW, iconH);
    bullets(c.pts, { x: cx + 0.25, y: cy + 1.5, w: cw - 0.5, h: ch - 1.55, gap: 2 });
  });
  // capability table (Table 1 of the paper)
  const ty = p.bottom - tableH;
  const hdr = { bold: true, color: 'FFFFFF', fill: { color: NAVY }, align: 'center', valign: 'middle', fontSize: 24 };
  const cell = (t, o) => ({ text: t, options: Object.assign({ fontFace: FONT, fontSize: 24, align: 'center', valign: 'middle', color: TXT, margin: 0.03 }, o || {}) });
  const chk = (yes, o) => cell(yes ? '✓' : '–', Object.assign({ bold: true, color: yes ? BLUE : MUTED, fontSize: 26 }, o || {}));
  const rowsT = [['Localization', 1, 0, 0], ['Identification', 0, 1, 0], ['L&I', 1, 1, 0], ['Exploratory', 1, 1, 1]];
  const rowsOut = [[cell('Task', hdr), cell('Spatial (WHERE)', hdr), cell('Spectral (WHAT)', hdr), cell('Explore', hdr)]];
  rowsT.forEach(([n, a, b, c], i) => {
    const f = { fill: { color: i % 2 ? 'FFFFFF' : 'EEF3FA' } };
    rowsOut.push([cell(n, Object.assign({ align: 'left', bold: true, color: NAVY, margin: [0.03, 0.03, 0.03, 0.15] }, f)), chk(a, f), chk(b, f), chk(c, f)]);
  });
  slide.addTable(rowsOut, { x: p.x, y: ty, w: p.w, colW: [4.6, 3.3, 3.3, 2.6], rowH: 0.5, border: { type: 'solid', color: 'C9D3E3', pt: 1 }, fontFace: FONT });
}

// ============================ MIDDLE: FRAMEWORK ===================================
{
  const p = panel(MX, Y0, MW, FW_H, 'S2A2 Framework: Spatial-Spectral Audio Action');
  bullets([
    [C('Key idea: '), 'feed the ', B('sound-source position'), ' from microphone arrays into the policy as an explicit ', B('acoustic spatial map'), ', together with a Spotforming spectrogram and vision.'],
  ], { x: p.x, y: p.y, w: p.w, h: 1.05, nobullet: true });
  const dy = p.y + 1.1, dh = p.bottom - dy;
  const envX = p.x, envW = 3.3, pipX = envX + envW + 0.27, pipW = 7.9;
  const catX = pipX + pipW + 0.27, catW = 0.8, polX = catX + catW + 0.3, polW = 1.7;
  const tskX = polX + polW + 0.27, tskW = p.x + p.w - tskX;
  label('Environment', envX, dy, envW, 0.42);
  label('Processing Pipelines', pipX, dy, pipW, 0.42);
  label('Multimodal Policy', catX, dy, polX + polW - catX, 0.42);
  label('Tasks', tskX, dy, tskW, 0.42);
  const by = dy + 0.47, bh = dh - 0.47;
  // environment
  box(envX, by, envW, bh, GREY_L, GREY_L);
  const envImW = envW - 0.3, envImH = envImW * 0.625;
  img('icon_cam.png', envX + 0.2, by + 0.1, 0.6, 0.6);
  label('RGB cameras', envX + 0.9, by + 0.1, envW - 1.0, 0.6, { align: 'left', fontSize: 20 });
  img('real_env.jpg', envX + 0.15, by + 0.8, envImW, envImH);
  const micY = by + 0.9 + envImH;
  img('icon_mic.png', envX + 0.2, micY, 0.6, 0.6);
  label('4 microphone arrays', envX + 0.9, micY, envW - 1.0, 0.6, { align: 'left', fontSize: 20 });
  label('Ambiguous visuals', envX, by + bh - 0.45, envW, 0.42, { fontSize: 20, color: MUTED, bold: false });
  // pipelines
  const rowGap = 0.12, rowH = (bh - 2 * rowGap) / 3;
  const rows = [
    { fill: 'EAF1FA', lc: BLUE, title: 'RGB image', enc: 'Vision\nEncoder', encFill: SKY },
    { fill: ORANGE_L, lc: ORANGE, title: 'Acoustic spatial map', sub: 'MUSIC [5] → 224×224×N map', enc: 'Spatial\nEncoder', encFill: 'F6C6A8' },
    { fill: GREEN_L, lc: GREEN, title: 'Spectrogram', sub: 'Spotforming [6]: beamforming + NMF', enc: 'Spectral\nEncoder', encFill: 'BFE0BA' },
  ];
  const encW = 1.55, encX = pipX + pipW - encW - 0.15;
  const rowMid = [];
  rows.forEach((r, i) => {
    const ry = by + i * (rowH + rowGap);
    box(pipX, ry, pipW, rowH, r.fill, r.lc);
    label([{ text: r.title, options: { bold: true } }, { text: r.sub ? '   ' + r.sub : '', options: { bold: false } }],
      pipX + 0.15, ry + 0.03, pipW - 0.3, 0.38, { align: 'left', fontSize: 20, color: r.lc });
    const ih = rowH - 0.55, iy = ry + 0.45;
    rowMid.push(iy + ih / 2);
    box(encX, iy, encW, ih, r.encFill, r.lc);
    label(r.enc, encX, iy, encW, ih, { fontSize: 20, color: TXT });
    const im1 = pipX + 0.3, im2 = im1 + ih + 0.6, lblX = im2 + ih + 0.15, lblW = encX - lblX - 0.5;
    if (i === 0) {
      img('cam_wrist.png', im1, iy, ih, ih);
      img('sim_front.png', im1 + ih + 0.15, iy, ih, ih);
      label('wrist / front\ncamera images', im1 + 2 * ih + 0.3, iy, encX - (im1 + 2 * ih + 0.3) - 0.5, ih, { fontSize: 20, bold: false, color: MUTED, align: 'left' });
    } else if (i === 1) {
      img('cam_top_small.png', im1, iy, ih, ih);
      arrow(im1 + ih + 0.08, iy + ih / 2, im2 - 0.08, iy + ih / 2, r.lc, 2.5);
      img('spatial_map.png', im2, iy, ih, ih);
      label('likelihood of the\nsource position', lblX, iy, lblW, ih, { fontSize: 20, bold: false, color: MUTED, align: 'left' });
    } else {
      img('sim_map.png', im1, iy, ih, ih);
      slide.addShape(pres.ShapeType.star5, { x: im1 + ih * 0.03, y: iy + ih * 0.62, w: 0.28, h: 0.28, fill: { color: 'FFFFFF' }, line: { color: TXT, width: 1 } });
      arrow(im1 + ih + 0.08, iy + ih / 2, im2 - 0.08, iy + ih / 2, r.lc, 2.5);
      img('sim_spec.png', im2, iy, ih, ih);
      label('sound separated\nat the peak ★', lblX, iy, lblW, ih, { fontSize: 20, bold: false, color: MUTED, align: 'left' });
    }
    arrow(encX - 0.42, iy + ih / 2, encX - 0.04, iy + ih / 2, r.lc, 2.5);
  });
  arrow(envX + envW, by + 0.4, pipX, rowMid[0], BLUE, 2.5);
  const mY = micY + 0.3, busX = envX + envW + 0.13;
  line(envX + envW, mY, busX, mY, GREEN, 2.5);
  line(busX, rowMid[1], busX, rowMid[2], GREEN, 2.5);
  arrow(busX, rowMid[1], pipX, rowMid[1], ORANGE, 2.5);
  arrow(busX, rowMid[2], pipX, rowMid[2], GREEN, 2.5);
  // feature concat + policy
  box(catX, by, catW, bh, SKY, BLUE);
  text('Feature Concat  (+ proprioception)', { x: catX + catW / 2 - bh / 2, y: by + bh / 2 - catW / 2, w: bh, h: catW, rotate: 270, fontSize: 20, bold: true, color: NAVY, align: 'center', valign: 'middle' });
  rows.forEach((r, i) => arrow(encX + encW, rowMid[i], catX, rowMid[i], r.lc, 2.5));
  box(polX, by, polW, bh, 'FDE9CF', 'E0A050');
  text([
    { text: 'Policy\nNetwork\n', options: { bold: true, color: NAVY, breakLine: true } },
    { text: 'ACT [7]', options: { breakLine: true } },
    { text: 'Diffusion\nPolicy [8]', options: { breakLine: true } },
    { text: 'VQ-BeT [9]', options: { breakLine: true } },
    { text: 'π0 [10]\n', options: { breakLine: true } },
    { text: '→ action\nchunk', options: { color: MUTED } },
  ], { x: polX + 0.05, y: by + 0.05, w: polW - 0.1, h: bh - 0.1, fontSize: 20, align: 'center', valign: 'middle', lineSpacingMultiple: 1.0 });
  arrow(catX + catW, by + bh / 2, polX, by + bh / 2, NAVY, 3);
  // tasks
  box(tskX, by, tskW, bh, GREY_L, GREY_L);
  const tiw = tskW - 0.2, tih = tiw * 0.75;
  img('photo_li.jpg', tskX + 0.1, by + 0.1, tiw, tih);
  label('Localization &\nIdentification', tskX + 0.1, by + 0.12 + tih, tiw, 0.7, { fontSize: 20 });
  img('photo_ex.jpg', tskX + 0.1, by + 0.9 + tih, tiw, tih);
  label('Exploratory', tskX + 0.1, by + 0.92 + 2 * tih, tiw, 0.4, { fontSize: 20 });
  arrow(polX + polW, by + bh / 2, tskX, by + bh / 2, NAVY, 3);
}

// ============================ MIDDLE: SIMULATION ==================================
{
  const PY = Y0 + FW_H + GAP;
  const p = panel(MX, PY, MW, YEND - PY, 'Simulation Results');
  // --- setup row: environment images + text
  const si = 1.25;
  captioned('sim_front.png', p.x, p.y, si, si, 'front cam.');
  captioned('sim_top.png', p.x + si + 0.15, p.y, si, si, 'side cam.');
  bullets([
    [B('Setup: '), 'Genesis [11] + Pyroomacoustics [12]; Franka Panda; 4 mic arrays @ 10 FPS; 2 cameras @ 30 FPS; 100–200 demos per task'],
    [B('Metric: '), 'success rate (%) over 100 trials × 3 seeds.   DP = Diffusion Policy'],
  ], { x: p.x + 2 * si + 0.45, y: p.y, w: p.w - 2 * si - 0.45, h: si + 0.45, gap: 2, nobullet: true });
  // --- legend + 4 charts
  const ly = p.y + si + 0.5;
  legendRow(p.x + 0.2, ly, [['Baseline (RGB only)', SER.base], ['S2A2 (ours)', SER.s2a2], ['w/o Spec. (no spectrogram)', SER.spec], ['w/o Spat. (no spatial map)', SER.spat]]);
  const cats = ['ACT', 'DP', 'VQ-BeT', 'π0'];
  const sim = {
    'Localization':   { base: [20.3, 13.3, 12.7, 18.3], s2a2: [73.0, 68.0, 40.3, 32.0], spec: [74.7, 68.3, 44.7, 17.3], spat: [15.3, 15.3, 12.3, 14.7] },
    'Identification': { base: [39.3, 41.3, 24.0, 32.3], s2a2: [76.7, 67.7, 32.3, 73.3], spec: [44.3, 32.7, 32.7, 40.0], spat: [74.3, 80.3, 49.3, 78.7] },
    'L&I':            { base: [11.0, 9.3, 7.7, 7.0],    s2a2: [78.7, 89.7, 55.3, 45.7], spec: [45.0, 46.0, 32.3, 14.3], spat: [25.7, 8.7, 19.0, 19.7] },
    'Exploratory':    { base: [35.0, 26.3, 17.3, 9.0],  s2a2: [77.3, 44.0, 32.7, 18.7], spec: [75.3, 37.3, 20.0, 26.7], spat: [72.3, 6.3, 25.0, 9.3] },
  };
  const cy0 = ly + 0.6, chH = 3.0, chW = (p.w - 0.45) / 4;
  Object.entries(sim).forEach(([name, d], i) => {
    const cx = p.x + i * (chW + 0.15);
    slide.addChart(pres.ChartType.bar, [
      { name: 'Baseline', labels: cats, values: d.base },
      { name: 'S2A2', labels: cats, values: d.s2a2 },
      { name: 'w/o Spec.', labels: cats, values: d.spec },
      { name: 'w/o Spat.', labels: cats, values: d.spat },
    ], Object.assign({}, chartBase, { x: cx, y: cy0, w: chW, h: chH, barGapWidthPct: 40, showTitle: true, title: name + ' task', showLegend: false }));
  });
  const fy = cy0 + chH + 0.05;
  bullets([
    [B('S2A2 is best on L&I for all 4 policies.'), ' The spatial map helps whenever ', C('WHERE'), ' matters and beats raw multi-channel audio there (ACT, Localization: 73 vs 43 %).'],
  ], { x: p.x, y: fy, w: p.w, h: 1.05 });
  // --- t-SNE latent space (Fig. 4a)
  const ty = fy + 1.1, th = p.bottom - ty;
  label('Latent space of Diffusion Policy on the L&I task (t-SNE [13])', p.x, ty, p.w, 0.4, { fontSize: 22, align: 'left' });
  const conds = ['Baseline', 'S2A2', 'w/o Spec.', 'w/o Spat.'];
  const rowLblW = 1.45, ph = (th - 0.45 - 0.35 - 0.1) / 2, pw = ph * 755 / 907;
  conds.forEach((c, j) => label(c, p.x + rowLblW + j * (pw + 0.1) - 0.15, ty + 0.42, pw + 0.3, 0.33, { fontSize: 20, color: j === 1 ? NAVY : MUTED }));
  ['Sound\ntype', 'Source\nY-coord.'].forEach((r, i) => {
    const yy = ty + 0.78 + i * (ph + 0.1);
    label(r, p.x, yy, rowLblW - 0.1, ph, { fontSize: 20, align: 'right', color: MUTED });
    conds.forEach((c, j) => img(`tsne_r${i}_c${j}.png`, p.x + rowLblW + j * (pw + 0.1), yy, pw, ph));
  });
  const tx = p.x + rowLblW + 4 * (pw + 0.1) + 0.2;
  bullets([
    ['Color = sound type (top) or Y-coordinate of the sounding object (bottom).'],
    [B('S2A2'), ' separates ', C('both'), ' cues; w/o Spat. loses position, w/o Spec. loses timbre → the two acoustic cues play independent roles in the latent space.'],
  ], { x: tx, y: ty + 0.45, w: p.x + p.w - tx, h: th - 0.45, gap: 4, nobullet: true });
}

// ============================ RIGHT: REAL ROBOT ===================================
{
  const p = panel(RX, Y0, RW, RR_H, 'Real Robot Results');
  const ph = 3.0, pw = ph / 0.625;
  captioned('real_env.jpg', p.x, p.y, pw, ph, 'Top-down view, 4 microphone arrays');
  bullets([
    ['ILOHA arm (ALOHA-type [7]): 6 joints + gripper'],
    ['4 TAMAGO-03 arrays (8 ch, 16 kHz); top-down + wrist RGB'],
    [B('ACT'), '; 100 teleop demos per task; 100 trials'],
    [B('S2A2 wins both tasks'), ': 72 % on L&I vs 5 % vision-only; spatial + spectral > either'],
  ], { x: p.x + pw + 0.3, y: p.y, w: p.w - pw - 0.3, h: ph + 0.45, gap: 1 });
  const cy = p.y + ph + 0.5, ch = p.bottom - cy, cw = 6.7;
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
  const sx = p.x + cw + 0.3, sw = p.w - cw - 0.3, sh = sw * 464 / 1452;
  const blockH = 0.45 + sh + 0.67, sy = cy + (ch - blockH) / 2;
  label('S2A2 + ACT on the exploratory task', sx, sy, sw, 0.42, { fontSize: 22 });
  img('real_seq.png', sx, sy + 0.45, sw, sh);
  label('Top: robot.  Bottom: acoustic spatial map on the top-down view.  Time →', sx, sy + 0.47 + sh, sw, 0.65, { fontSize: 20, color: MUTED, bold: false });
}

// ============================ RIGHT: CONCLUSION ===================================
{
  const PY = Y0 + RR_H + GAP;
  const p = panel(RX, PY, RW, CC_H, 'Conclusion & Limitations');
  bullets([
    [C('✔ '), 'Explicit ', B('spatial map + spectrogram'), ' is best when a task needs both ', C('WHERE'), ' and ', C('WHAT'), ' (sim: all 4 policies; real: 72 % / 50 %).'],
    [C('✔ '), 'Unneeded acoustic pipelines can hurt with few demos; the gain depends on the policy architecture.'],
    [{ text: '⚠ ', options: { color: ORANGE, bold: true } }, 'Single source, known array placement, exploration imitated from demos. Next: multi-source, sim-to-real [14].'],
  ], { x: p.x, y: p.y - 0.05, w: p.w, h: p.h, gap: 3, nobullet: true });
}

// ============================ RIGHT: CONTACT & REFERENCES ==========================
{
  const PY = Y0 + RR_H + GAP + CC_H + GAP;
  const p = panel(RX, PY, RW, YEND - PY, 'Contact & References');
  text([
    { text: 'Kaneyoshi Hiratsuka', options: { bold: true, breakLine: true } },
    { text: 'Kyoto University / RIKEN', options: { breakLine: true } },
    { text: 'hiratsuka.kaneyoshi.i62@kyoto-u.jp', options: { breakLine: true } },
    { text: 'https://azuma413.github.io/' },
  ], { x: p.x, y: p.y, w: 6.8, h: 2.1, fontSize: 28, lineSpacingMultiple: 1.05 });
  const qs = [['qr_arxiv.png', 'Paper'], ['qr_code.png', 'Code'], ['qr_webpage.png', 'Webpage']];
  const qsz = 1.6, qy = p.y + 2.3;
  qs.forEach(([f, n], i) => {
    const qx = p.x + i * (qsz + 0.35);
    img(f, qx, qy, qsz, qsz);
    label(n, qx - 0.2, qy + qsz + 0.02, qsz + 0.4, 0.4, { fontSize: 24 });
  });
  const refs = [
    '[1] Du et al. Play it by ear. RSS 2022.',
    '[2] Li et al. See, hear, and feel. CoRL 2022.',
    '[3] Nakadai & Okuno. Robot audition. Adv. Intell. Syst. 2020.',
    '[4] Liu et al. ManiWAV. CoRL 2024.',
    '[5] Schmidt. MUSIC. IEEE Trans. Antennas Propag. 1986.',
    '[6] Kagimoto et al. Spotforming by NMF. IROS 2022.',
    '[7] Zhao et al. ACT. RSS 2023.',
    '[8] Chi et al. Diffusion Policy. IJRR 2024.',
    '[9] Lee et al. VQ-BeT. ICML 2024.',
    '[10] Black et al. π0. arXiv 2024.',
    '[11] Genesis Authors. Genesis physics engine. 2024.',
    '[12] Scheibler et al. Pyroomacoustics. ICASSP 2018.',
    '[13] van der Maaten & Hinton. t-SNE. JMLR 2008.',
    '[14] Wang et al. The sound of simulation. CoRL 2025.',
    'Acknowledgments: JST CREST (JPMJCR22D3), JST Moonshot R&D (JPMJMS2024), JSPS KAKENHI (JP26H02532, JP26H02525), RIKEN TRIP initiative (AGIS).',
  ].map((t, i, a) => ({ text: t, options: { breakLine: i < a.length - 1, paraSpaceBefore: t.startsWith('Ack') ? 6 : 0 } }));
  text(refs, { x: p.x + 7.0, y: p.y - 0.05, w: p.w - 7.0, h: p.h + 0.05, fontSize: 16, color: MUTED, lineSpacingMultiple: 1.0 });
}

pres.writeFile({ fileName: OUT }).then(() => console.log('wrote', OUT));
