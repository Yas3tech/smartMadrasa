const fs = require('fs');

const contextFiles = [
  'src/context/DataContext.tsx',
  'src/context/AuthContext.tsx',
];

contextFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // AuthContext specific
    content = content.replace(/export interface AuthContextType/, 'interface AuthContextType');

    // DataContext specific
    content = content.replace(/export interface DataContextType/, 'interface DataContextType');
    content = content.replace(/export const DataContext = /, 'const DataContext = ');
    content = content.replace(/export type SortConfig<T>/, 'type SortConfig<T>');

    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
  }
});
