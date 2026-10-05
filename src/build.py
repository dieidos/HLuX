# Assemble ../index.html à partir de style.css, body.html, app.js, logo.svg et aqua.ttf.
# Usage : python src/build.py   (depuis le dossier HLuX, ou n'importe où)
import base64, os, re

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(SRC), 'index.html')
read = lambda name: open(os.path.join(SRC, name), encoding='utf-8').read()

aqua = 'data:font/ttf;base64,' + base64.b64encode(open(os.path.join(SRC, 'aqua.ttf'), 'rb').read()).decode()
svg = read('logo.svg')
viewbox = re.search(r'viewBox="([^"]+)"', svg).group(1)
inner = re.sub(r'\s+', ' ', re.sub(r'^[\s\S]*?<svg[^>]*>|</svg>\s*$', '', svg).strip())

css = read('style.css').replace('{{AQUA}}', aqua)
body = read('body.html').replace('{{LOGO_VIEWBOX}}', viewbox).replace('{{LOGO_INNER}}', inner)
js = read('app.js')
import shutil, subprocess
if shutil.which('node'):
    chk = subprocess.run(['node', '--check', os.path.join(SRC, 'app.js')], capture_output=True, text=True)
    if chk.returncode:
        raise SystemExit('Erreur de syntaxe dans app.js :\n' + chk.stderr)

SITE = 'https://dieidos.github.io/HLuX/'
TITLE = 'Atlas - HLuX, by dieidos'
DESC = "Du Projet Personnalisé au Projet d'Établissement : un même fil, d'Amina au CHRS Les Lilas. By dieidos."

html = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#8c6aa8">
<link rel="canonical" href="{SITE}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Harmonia Lux">
<meta property="og:title" content="{TITLE}">
<meta property="og:description" content="{DESC}">
<meta property="og:url" content="{SITE}">
<meta property="og:image" content="{SITE}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Harmonia Lux, du Projet Personnalisé au Projet d'Établissement">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="HLuX">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Quicksand:wght@600;700&display=swap">
<style>
{css}
</style>
</head>
<body>
{body}
<script>
{js}
</script>
</body>
</html>
'''
open(OUT, 'w', encoding='utf-8').write(html)
print('index.html', len(html.encode()), 'octets')
