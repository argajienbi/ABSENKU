const fs = require('fs');

const menuContent = fs.readFileSync('src/pages/views/profile/ProfileMenu.tsx', 'utf-8');
const idCardContent = fs.readFileSync('src/pages/views/profile/ProfileIdCard.tsx', 'utf-8');
const changelogContent = fs.readFileSync('src/pages/views/profile/ProfileChangelog.tsx', 'utf-8');
const editProfileContent = fs.readFileSync('src/pages/views/profile/ProfileEdit.tsx', 'utf-8');

console.log('--- menu ---');
console.log(menuContent.slice(menuContent.indexOf('return ('), menuContent.indexOf('return (') + 100));
console.log('... ending:');
console.log(menuContent.slice(-100));

console.log('--- edit ---');
console.log(editProfileContent.slice(editProfileContent.indexOf('return ('), editProfileContent.indexOf('return (') + 100));
console.log('... ending:');
console.log(editProfileContent.slice(-100));
