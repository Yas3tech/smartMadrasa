import fs from 'fs';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.pnpm = pkg.pnpm || {};
pkg.pnpm.overrides = pkg.pnpm.overrides || {};

pkg.pnpm.overrides["jspdf"] = "^4.2.1";
pkg.pnpm.overrides["fast-xml-parser"] = "^5.5.6";
pkg.pnpm.overrides["flatted"] = "^3.4.2";
pkg.pnpm.overrides["node-forge"] = "^1.4.0";
pkg.pnpm.overrides["picomatch@<2.3.2"] = "^2.3.2";
pkg.pnpm.overrides["picomatch@>=4.0.0 <4.0.4"] = "^4.0.4";
pkg.pnpm.overrides["vite"] = "^7.3.2";
pkg.pnpm.overrides["postcss"] = "^8.5.6";

pkg.devDependencies["vite"] = "^7.3.2";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
