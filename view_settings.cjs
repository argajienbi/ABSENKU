const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
const lines = content.split('\n');

const settingsIdx = lines.findIndex(l => l.includes('<TabsContent value="settings"'));
const logsIdx = lines.findIndex(l => l.includes('<TabsContent value="logs"'));

console.log(lines.slice(settingsIdx, settingsIdx + 30).join('\n'));
