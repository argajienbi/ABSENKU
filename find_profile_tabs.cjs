const fs = require('fs');
const content = fs.readFileSync('src/pages/views/ProfileView.tsx', 'utf-8');
const lines = content.split('\n');

const menuStart = lines.findIndex(l => l.includes('profileTab === "menu"'));
const idCardStart = lines.findIndex(l => l.includes('profileTab === "id-card"'));
const changelogStart = lines.findIndex(l => l.includes('profileTab === "changelog"'));
const editProfileStart = lines.findIndex(l => l.includes('profileTab === "edit-profile"'));

console.log('menu:', menuStart);
console.log('id-card:', idCardStart);
console.log('changelog:', changelogStart);
console.log('edit-profile:', editProfileStart);
