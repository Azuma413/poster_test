"""Prepare cropped / rasterised assets for the CoRL 2026 poster (build.js).

Usage:  python prep_assets.py <repo_root> <out_dir>
"""
import sys, os, subprocess
from PIL import Image

root, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

def save(im, name, maxw=None):
    if maxw and im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, name))
    print(name, im.size)

# --- images taken from the previous poster (kept in src_media/) -------------
SM = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src_media')
def media(n): return Image.open(os.path.join(SM, n))

save(media('illust_hidden_state.png').convert('RGB'),  'bg_hidden.jpg', 1200)
save(media('illust_sort_by_sound.png').convert('RGB').crop((0, 135, 1024, 817)), 'bg_sort.jpg', 1200)   # same 3:2 crop as the previous poster
save(media('wrist_cam_224.png').convert('RGB'),   'cam_wrist.png')        # wrist camera (RGB image example)
save(media('top_cam_224.png').convert('RGB'),     'cam_top_small.png')    # top-down w/ 4 arrays
save(media('spatial_map_224.png').convert('RGB'), 'spatial_map.png')      # acoustic spatial map example
save(media('photo_li.jpeg').convert('RGB'),       'photo_li.jpg', 1400)   # L&I real robot
save(media('corl_logo.png').convert('RGBA'),      'corl_logo.png')

# --- environment photo used in the framework figure (same crop as the previous poster)
env = Image.open(os.path.join(root, 'fig', 'PXL_20260520_083719104.jpg')).convert('RGB')
W, H = env.size
save(env.crop((int(W * 0.14402), int(H * 0.14170), int(W * (1 - 0.12138)), int(H * (1 - 0.26031)))), 'env_crop.jpg', 1400)

# --- two visually identical cans (exploratory task) for the Environment block
cans = Image.open(os.path.join(root, 'fig', 'PXL_20260519_164846892.MP.jpg')).convert('RGB')
save(cans.crop((1140, 1418, 3260, 2683)), 'cans.jpg', 1200)   # centred on the two cans; aspect 2120:1265 matches the slot in build.js

# --- real spectrogram (bottom-right quadrant of the real-robot observation grid)
obs = Image.open(os.path.join(root, 'fig', 'untitled-f000080.png')).convert('RGB')
save(obs.crop((960, 540, 1495, 1080)), 'real_spec.png')

# --- simulation top-down view for the setup diagram (same crop as the previous poster)
save(Image.open(os.path.join(root, 'fig', 'observation.images.front.png')).convert('RGB').crop((0, 0, 456, 400)), 'sim_topdown.png')

# --- real environment photo (top-down, 4 arrays) ----------------------------
im = Image.open(os.path.join(root, 'fig', 'PXL_20260520_083719104.jpg')).convert('RGB')
save(im.crop((0, 0, 4000, 2500)), 'real_env.jpg', 1600)   # drop the operator's legs at the bottom
im = Image.open(os.path.join(root, 'fig', 'PXL_20260519_140610276.MP.jpg')).convert('RGB')
save(im, 'photo_ex.jpg', 1400)

# --- simulation observation quadrants (front / top / spatial map / spectrogram)
sim = Image.open(os.path.join(root, 'fig', 'task', 'soundSim1.png')).convert('RGB')
save(sim.crop((420, 0, 960, 540)),    'sim_front.png')
save(sim.crop((960, 0, 1500, 540)),   'sim_top.png')
save(sim.crop((420, 540, 960, 1080)), 'sim_map.png')
save(sim.crop((960, 540, 1500, 1080)),'sim_spec.png')

# --- t-SNE panels (Fig.4a): rows = sound type / source Y-coordinate, cols = Baseline, S2A2, w/o Spec., w/o Spat.
f4 = Image.open(os.path.join(root, 'fig', 'fig4.png')).convert('RGB')
cols = [(107, 862), (892, 1648), (1678, 2434), (2464, 3220)]
rows = [(104, 1011), (1111, 2018)]
for r, (y0, y1) in enumerate(rows):
    for c, (x0, x1) in enumerate(cols):
        save(f4.crop((x0 + 4, y0 + 4, x1 - 4, y1 - 4)), f'tsne_r{r}_c{c}.png', 600)

# --- per-task overhead views (top-right quadrant of the task screenshots)
for name, f in [('task_L', 'sound1.png'), ('task_I', 'soundDiff.png'), ('task_LI', 'soundSim1.png'), ('task_Ex', 'soundShake1.png')]:
    t = Image.open(os.path.join(root, 'fig', 'task', f)).convert('RGB')
    save(t.crop((960, 0, 1500, 540)), name + '.png')

# --- colour bar strip of Fig.4 (viridis, Y-coordinate of the source)
save(f4.crop((4064, 99, 4164, 2022)), 'tsne_cbar.png')

# --- real robot sequence (Fig.5a: robot row + acoustic spatial map overlay row)
f5 = Image.open(os.path.join(root, 'fig', 'fig5.png')).convert('RGB')
save(f5.crop((0, 72, 1452, 776)), 'real_seq.png')   # robot / spatial map / spectrogram rows

# --- header band gradient (sampled from the hand-edited poster: light blue at the logos -> 0E58C3)
stops = [(0.00, (0xA7, 0xC8, 0xF5)), (0.19, (0x5A, 0x8F, 0xDD)), (0.29, (0x3A, 0x77, 0xD2)), (0.42, (0x0E, 0x58, 0xC3)), (1.0, (0x0E, 0x58, 0xC3))]
band = Image.new('RGB', (4800, 300))
px = band.load()
for xi in range(4800):
    t = xi / 4799
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        if t0 <= t <= t1:
            u = (t - t0) / (t1 - t0) if t1 > t0 else 0
            col = tuple(round(c0[k] + (c1[k] - c0[k]) * u) for k in range(3))
            break
    for yi in range(300):
        px[xi, yi] = col
band.save(os.path.join(out, 'band.png')); print('band.png')

# --- logos ---------------------------------------------------------------------
save(Image.open(os.path.join(root, 'ロゴ', 'E-C.png')).convert('RGBA'), 'kyoto.png')
save(Image.open(os.path.join(root, 'ロゴ', 'symbol4_300_.gif')).convert('RGBA'), 'riken.png')
save(Image.open(os.path.join(root, 'ロゴ', 'mmai_rgb_touka_.png')).convert('RGBA'), 'mmai.png')
for q in ['code', 'arxiv', 'webpage']:
    save(Image.open(os.path.join(root, 'qrcode', q + '.png')).convert('RGB'), f'qr_{q}.png')

# --- task icons + camera / mic icons (SVG -> PNG via sharp) ---------------------
svgs = {'icon_L': os.path.join(root, 'fig', 'L.svg'), 'icon_I': os.path.join(root, 'fig', 'I.svg'),
        'icon_LI': os.path.join(root, 'fig', 'L&I.svg'), 'icon_Ex': os.path.join(root, 'fig', 'Ex.svg')}
svgs['icon_mic'] = os.path.join(SM, 'icon_mic.svg')
svgs['icon_cam'] = os.path.join(SM, 'icon_cam.svg')
js = "const sharp=require('sharp');(async()=>{for(const [n,p] of Object.entries(%s)){await sharp(p,{density:600}).resize({width:1200}).png().toFile(%r+'/'+n+'.png');console.log(n)}})()" % (
    repr(svgs).replace("'", '"'), out)
subprocess.run(['node', '-e', js], check=True, cwd=os.path.dirname(os.path.abspath(__file__)))
