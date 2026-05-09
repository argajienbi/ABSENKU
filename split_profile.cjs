const fs = require('fs');

fs.mkdirSync('src/pages/views/profile', { recursive: true });

const content = fs.readFileSync('src/pages/views/ProfileView.tsx', 'utf-8');

const getChunk = (startMarker, endMarker) => {
   const start = content.indexOf(startMarker);
   if (start === -1) return null;
   const end = endMarker ? content.indexOf(endMarker, start) : content.length;
   return content.slice(start, end);
};

// Instead of string markers which might be repeated, let's use the explicit string:
// {profileTab === "menu" && ( ... )}

const splitContent = (startStr, endStr) => {
    const start = content.indexOf(startStr);
    const end = endStr ? content.indexOf(endStr, start) : content.lastIndexOf('</div>');
    return content.slice(start, end);
};

// Oh wait, in JSX chunks they are closed by `)}`
// Let's just create a script that reads lines
const lines = content.split('\\n');
