const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const s1 = content.indexOf('<TabsContent value="logs"');
const s2 = content.indexOf('</TabsContent>', s1) + '</TabsContent>'.length;

const chunk = content.slice(s1, s2);

fs.writeFileSync('src/pages/dashboard/LogsTab.tsx', 
`import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { ShieldAlert, AlertCircle, Ban, Search } from "lucide-react";
import { format } from "date-fns";

export function LogsTab({ securityLogs }: any) {
  return (
    ` + chunk.replace(/<TabsContent value="logs"[^>]*>/, '<div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">').replace(/<\/TabsContent>/g, '</div>') + `
  );
}
`
);

const replacement = `
              <TabsContent value="logs">
                  <LogsTab securityLogs={securityLogs} />
              </TabsContent>
`;

let newContent = content.slice(0, s1) + replacement.trim() + content.slice(s2);

newContent = newContent.replace(
    'import { SettingsTab } from "./dashboard/SettingsTab";',
    'import { SettingsTab } from "./dashboard/SettingsTab";\nimport { LogsTab } from "./dashboard/LogsTab";'
);

fs.writeFileSync('src/pages/Dashboard.tsx', newContent);

console.log("Extracted logs");
