const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/OverviewTab.tsx', 'utf-8');

content = content.replace(/<\/TabsContent>/g, '</div>');

fs.writeFileSync('src/pages/dashboard/OverviewTab.tsx', content);

console.log("fixed closing tab");
