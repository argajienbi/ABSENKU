const fs = require('fs');
const path = require('path');

function countLines(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', '.next'].includes(file)) {
        results = results.concat(countLines(filePath));
      }
    } else {
      if (['.ts', '.tsx', '.js', '.jsx', '.css'].some(ext => file.endsWith(ext))) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        results.push({ file: filePath, lines });
      }
    }
  }
  return results;
}

const files = countLines('./src');
files.sort((a, b) => b.lines - a.lines);

console.log('Top 10 files by line count:');
files.slice(0, 10).forEach((f, i) => {
  console.log(`${i + 1}. ${f.file} - ${f.lines} lines`);
});
