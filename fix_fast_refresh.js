const fs = require('fs');

const contextFiles = [
  'src/context/DataContext.tsx',
  'src/context/AuthContext.tsx',
];

contextFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace inline exports of interfaces/types/helper functions that break fast refresh
    content = content.replace(/export (interface|type|const) (?![A-Z][a-zA-Z0-9]*Provider|use[A-Z])/g, '$1 ');

    // AuthContext specific
    content = content.replace(/export interface AuthContextType/, 'interface AuthContextType');

    // DataContext specific
    content = content.replace(/export interface DataContextType/, 'interface DataContextType');
    content = content.replace(/export const DataContext = /, 'const DataContext = ');

    // Any remaining exports that shouldn't be exported
    // ...

    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
  }
});
