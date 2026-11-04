"""Post-process a pptxgenjs deck: keep only the first <a:pPr> in each paragraph.

pptxgenjs writes one <a:pPr> per text run; renderers then use the last one and
drop the bullet / spacing set on the first run.  Usage: python fix_pptx.py deck.pptx
"""
import re, sys, zipfile, shutil, os, json, html

src = sys.argv[1]
# optional sidecar written by build.js: {"<chart title>": [[std per category] per series, ...]}
errbars = {}
if os.path.exists(src + '.errbars.json'):
    errbars = json.load(open(src + '.errbars.json'))

def err_xml(vals):
    pts = ''.join(f'<c:pt idx="{i}"><c:v>{v}</c:v></c:pt>' for i, v in enumerate(vals))
    lit = f'<c:numLit><c:formatCode>General</c:formatCode><c:ptCount val="{len(vals)}"/>{pts}</c:numLit>'
    return ('<c:errBars><c:errBarType val="both"/><c:errValType val="cust"/><c:noEndCap val="0"/>'
            f'<c:plus>{lit}</c:plus><c:minus>{lit}</c:minus>'
            '<c:spPr><a:ln w="22225" cap="rnd"><a:solidFill><a:srgbClr val="333333"/></a:solidFill></a:ln></c:spPr></c:errBars>')

current_name = ''
DOTGRID = ('<a:pattFill prst="dotGrid"><a:fgClr><a:srgbClr val="0E58C3"/></a:fgClr>'
           '<a:bgClr><a:srgbClr val="FFFFFF"/></a:bgClr></a:pattFill>')

def dot_grid(xml):
    """Replace the solid fill of the shape named bg-dotgrid with a dot-grid pattern fill."""
    def per_shape(mm):
        body = mm.group(0)
        if 'name="bg-dotgrid"' not in body:
            return body
        return re.sub(r'<a:solidFill>.*?</a:solidFill>', DOTGRID, body, count=1, flags=re.S)
    return re.sub(r'<p:sp>.*?</p:sp>', per_shape, xml, flags=re.S)

def add_errbars(xml):
    m = re.search(r'<c:title>.*?<a:t>(.*?)</a:t>', xml, re.S)
    title = html.unescape(m.group(1)) if m else None
    key = title if title in errbars else None
    if key is None:
        m2 = re.search(r'chart(\d+)\.xml$', current_name)
        if m2 and ('#' + m2.group(1)) in errbars:
            key = '#' + m2.group(1)
    if key is None:
        return xml
    series = errbars[key]
    idx = [0]
    def per_ser(mm):
        body = mm.group(0)
        i = idx[0]; idx[0] += 1
        if i >= len(series):
            return body
        return body.replace('<c:cat>', err_xml(series[i]) + '<c:cat>', 1)
    return re.sub(r'<c:ser>.*?</c:ser>', per_ser, xml, flags=re.S)

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
        data = re.sub(r'<a:p>.*?</a:p>', fix_para, data.decode('utf-8'), flags=re.S)
        data = dot_grid(data).encode('utf-8')
    elif item.filename.startswith('ppt/charts/chart') and item.filename.endswith('.xml'):
        current_name = item.filename
        data = add_errbars(data.decode('utf-8')).encode('utf-8')
    zout.writestr(item, data)
zout.close(); zin.close()
shutil.move(tmp, src)
print('fixed', src)
