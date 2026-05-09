const fs = require('fs');
const content = fs.readFileSync('src/pages/views/ProfileView.tsx', 'utf-8');
const lines = content.split('\n');

const stateStart = lines.findIndex(l => l.includes('const ['));
console.log('State starts at:', stateStart);

const tabsStart = lines.findIndex(l => l.includes('<TabsContent value="'));
console.log('First tab starts at:', tabsStart);

lines.forEach((l, i) => {
    if (l.includes('<TabsContent value=')) {
        console.log('Tab:', l.trim(), 'at line:', i);
    }
});
