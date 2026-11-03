"""Post-process a pptxgenjs deck: keep only the first <a:pPr> in each paragraph.

pptxgenjs writes one <a:pPr> per text run; renderers then use the last one and
drop the bullet / spacing set on the first run.  Usage: python fix_pptx.py deck.pptx
"""
import re, sys, zipfile, shutil, os

src = sys.argv[1]
tmp = src + '.tmp'
zin = zipfile.ZipFile(src)
zout = zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED)
pPr = re.compile(r'<a:pPr\b[^>]*/>|<a:pPr\b[^>]*>.*?</a:pPr>', re.S)

def fix_para(m):
    body, n = m.group(0), [0]
    def keep_first(mm):
        n[0] += 1
        return mm.group(0) if n[0] == 1 else ''
    return pPr.sub(keep_first, body)

for item in zin.infolist():
    data = zin.read(item.filename)
    if item.filename.startswith('ppt/slides/slide') and item.filename.endswith('.xml'):
        data = re.sub(r'<a:p>.*?</a:p>', fix_para, data.decode('utf-8'), flags=re.S).encode('utf-8')
    zout.writestr(item, data)
zout.close(); zin.close()
shutil.move(tmp, src)
print('fixed', src)
