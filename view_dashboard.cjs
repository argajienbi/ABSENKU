const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
const lines = content.split('\n');

console.log(lines.slice(1748, 1780).join('\n'));
