const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const matches = [...content.matchAll(/<Dialog open={([^}]+)}/g)];
console.log(matches.map(m => m[1]).join('\n'));
