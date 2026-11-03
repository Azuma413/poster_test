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
save(media('illust_sort_by_sound.png').convert('RGB'), 'bg_sort.jpg', 1200)
save(media('wrist_cam_224.png').convert('RGB'),   'cam_wrist.png')        # wrist camera (RGB image example)
save(media('top_cam_224.png').convert('RGB'),     'cam_top_small.png')    # top-down w/ 4 arrays
save(media('spatial_map_224.png').convert('RGB'), 'spatial_map.png')      # acoustic spatial map example
save(media('photo_li.jpeg').convert('RGB'),       'photo_li.jpg', 1400)   # L&I real robot
save(media('corl_logo.png').convert('RGBA'),      'corl_logo.png')

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

# --- real robot sequence (Fig.5a: robot row + acoustic spatial map overlay row)
f5 = Image.open(os.path.join(root, 'fig', 'fig5.png')).convert('RGB')
save(f5.crop((0, 72, 1452, 536)), 'real_seq.png')

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
