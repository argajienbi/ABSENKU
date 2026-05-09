const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

console.log('Total length:', content.length);
const lines = content.split('\n');

let stateStart = -1;
let tabsStart = -1;

lines.forEach((line, i) => {
    if (line.includes('export default function Dashboard() {')) {
        console.log('Component starts at:', i);
    }
    if (line.includes('const [') && stateStart === -1) {
        stateStart = i;
    }
    if (line.includes('<TabsContent value="overview"')) {
        console.log('Overview tab starts at:', i);
    }
});

console.log('First state at:', stateStart);
