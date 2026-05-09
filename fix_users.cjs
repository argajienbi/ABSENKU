const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/UsersTab.tsx', 'utf-8');

content = content.replace(
  'setEditWeeklyShiftPattern, setEditShiftMode, settings, handleEditUser',
  'setEditWeeklyShiftPattern, setEditShiftMode, settings, handleEditUser, shiftsInput, areasInput, handleKoreksiAlpa, handleAddManualOvertime'
);

content = content.replace(
  'import { Download, ChevronDown, Trash2, MapPin, Search } from "lucide-react";',
  'import { Download, ChevronDown, Trash2, MapPin, Search, Printer } from "lucide-react";\nimport { format } from "date-fns";'
);

fs.writeFileSync('src/pages/dashboard/UsersTab.tsx', content);
console.log("fixed users tab imports");
