import json

with open('package.json', 'r') as f:
    pkg = json.load(f)

overrides = pkg.get('pnpm', {}).get('overrides', {})
# The audit output shows ANY picomatch >=4.0.0 <4.0.4 is vulnerable
# However, `tailwindcss > chokidar > anymatch > picomatch` is resolving to a vulnerable version
# We will just forcefully override all picomatch to be 4.0.4 or higher where we can
overrides['picomatch'] = '^4.0.4'

pkg['pnpm']['overrides'] = overrides

with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
