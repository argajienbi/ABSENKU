const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const tNames = ['announcements', 'analytics', 'live-map', 'rekap', 'settings', 'logs'];

tNames.forEach(name => {
    console.log("---- " + name + " ----");
    const start = content.indexOf('<TabsContent value="' + name + '"');
    const end = content.indexOf('</TabsContent>', start);
    console.log(content.slice(start, end + 14).slice(0, 150) + "... " + (end - start) + " chars");
});
