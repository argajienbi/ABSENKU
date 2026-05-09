const fs = require('fs');
const content = fs.readFileSync('src/pages/views/ProfileView.tsx', 'utf-8');
const lines = content.split('\n');
console.log(lines.slice(0, 50).join('\n'));
