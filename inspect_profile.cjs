const fs = require('fs');
const content = fs.readFileSync('src/pages/views/ProfileView.tsx', 'utf-8');
const lines = content.split('\n');

console.log("---- menu to id-card ----");
console.log(lines.slice(150, 160).join('\n'));

console.log("---- id-card to changelog ----");
console.log(lines.slice(300, 310).join('\n'));

console.log("---- changelog to edit-profile ----");
console.log(lines.slice(665, 675).join('\n'));

console.log("---- edit-profile to end ----");
console.log(lines.slice(lines.length - 10).join('\n'));
