const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('.map(')) {
          // Check inside the map callback for .find or .filter
          // This is a naive check, but let's see lines around it
          // Actually let's just use regex to find map with find or filter inside
        }
      }
      // Let's just find files that contain both .map( and .find(
      if (content.includes('.map(') && (content.includes('.find(') || content.includes('.filter('))) {
        // console.log(fullPath);
      }
    }
  }
}
processDir('src');
