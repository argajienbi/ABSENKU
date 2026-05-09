const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const stateMatches = [...content.matchAll(/const \[([^,]+),([^\]]+)\] = useState/g)];

const states = stateMatches.map(m => m[1].trim());

console.log(states.join('\n'));
