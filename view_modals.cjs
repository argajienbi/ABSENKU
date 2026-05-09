const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const s1 = content.lastIndexOf('</Tabs>');
console.log(content.slice(s1, s1+1000));
