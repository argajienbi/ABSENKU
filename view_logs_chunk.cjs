const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const s1 = content.indexOf('<TabsContent value="settings"');
const s2 = content.indexOf('<TabsContent value="logs"', s1);

console.log(content.slice(s2 - 200, s2 + 200));
