const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const sStart = content.indexOf('<TabsContent value="announcements"');
const sEnd = content.indexOf('</TabsContent>', sStart) + '</TabsContent>'.length;

const replacement = `
          <TabsContent value="announcements" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
             <AnnouncementsTab
                  announcementTitle={announcementTitle}
                  setAnnouncementTitle={setAnnouncementTitle}
                  announcementContent={announcementContent}
                  setAnnouncementContent={setAnnouncementContent}
                  announcementType={announcementType}
                  setAnnouncementType={setAnnouncementType}
                  announcements={announcements}
                  publishAnnouncement={publishAnnouncement}
                  deleteAnnouncement={deleteAnnouncement}
                  loadingConfig={loadingConfig}
             />
          </TabsContent>
`;

content = content.slice(0, sStart) + replacement.trim() + content.slice(sEnd);

// Add import
content = content.replace(
    'import { UsersTab } from "./dashboard/UsersTab";',
    'import { UsersTab } from "./dashboard/UsersTab";\nimport { AnnouncementsTab } from "./dashboard/AnnouncementsTab";'
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Replaced announcements");
