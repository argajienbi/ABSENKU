const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
const settingsIdx = content.indexOf('<TabsContent value="settings"');
console.log(content.slice(settingsIdx + 20000, settingsIdx + 22000));
