const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/LogsTab.tsx', 'utf-8');

content = content.replace(
  'import { format } from "date-fns";',
  'import { format } from "date-fns";\nimport { id } from "date-fns/locale";\nimport { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";'
);

fs.writeFileSync('src/pages/dashboard/LogsTab.tsx', content);
console.log("Fixed logs imports");
