const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/AnnouncementsTab.tsx', 'utf-8');

content = content.replace(
  'announcements, handleAddAnnouncement, handleDeleteAnnouncement',
  'announcements, publishAnnouncement, deleteAnnouncement, loadingConfig'
);

content = content.replace(
  'import { Input } from "../../components/ui/input";',
  'import { Input } from "../../components/ui/input";\nimport { Badge } from "../../components/ui/badge";'
);

content = content.replace(
  'import { Trash2 } from "lucide-react";',
  'import { Trash2, Briefcase } from "lucide-react";\nimport { format } from "date-fns";'
);

fs.writeFileSync('src/pages/dashboard/AnnouncementsTab.tsx', content);
console.log("fixed ann tab imports");
