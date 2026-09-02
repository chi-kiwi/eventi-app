import fs from 'fs';
import path from 'path';

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/#(ff[0-9a-f]{4}|ff4757|ff3838|ffa502|ff6b81|ff9f43)/gi);
      if (matches) {
        console.log(`${file}: ${[...new Set(matches)].join(', ')}`);
      }
    }
  }
}

scanDir('./src');
