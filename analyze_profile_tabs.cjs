const fs = require('fs');
const content = fs.readFileSync('src/pages/views/ProfileView.tsx', 'utf-8');
const matches = [...content.matchAll(/profileTab === "([^"]+)"/g)];
console.log(matches.map(m => m[1]).join(', '));
