const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
const lines = content.split('\n');

const tabNames = ['overview', 'users', 'announcements', 'analytics', 'live-map', 'rekap', 'settings', 'logs'];

tabNames.forEach(tab => {
    const startIdx = lines.findIndex(l => l.includes('<TabsContent value="' + tab + '"'));
    console.log('Tab: ' + tab + ', Starts at: ' + startIdx);
});
