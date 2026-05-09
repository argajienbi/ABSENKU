const fs = require('fs');
const editProfileContent = fs.readFileSync('src/pages/views/profile/ProfileEdit.tsx', 'utf-8');
console.log(editProfileContent.substring(editProfileContent.indexOf('return (')));
