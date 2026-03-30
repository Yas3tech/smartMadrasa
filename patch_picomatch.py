import json

with open('package.json', 'r') as f:
    pkg = json.load(f)

overrides = pkg.get('pnpm', {}).get('overrides', {})
# Overriding specific vulnerable versions based on the paths shown in audit output
overrides['picomatch@<2.3.2'] = '>=2.3.2'
overrides['picomatch@>=4.0.0 <4.0.4'] = '>=4.0.4'

pkg['pnpm']['overrides'] = overrides

with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
