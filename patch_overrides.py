import json

with open('package.json', 'r') as f:
    pkg = json.load(f)

overrides = pkg.get('pnpm', {}).get('overrides', {})
overrides['jspdf'] = '>=4.2.1'
overrides['fast-xml-parser'] = '>=5.5.6'
overrides['flatted'] = '>=3.4.2'
overrides['node-forge'] = '>=1.4.0'
overrides['picomatch'] = '>=2.3.2'

if 'pnpm' not in pkg:
    pkg['pnpm'] = {}
pkg['pnpm']['overrides'] = overrides

with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
