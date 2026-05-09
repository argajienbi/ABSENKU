const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const startMarker = '<TabsContent value="overview"';
const endMarker = '<TabsContent value="users"';

const start = content.indexOf(startMarker);
const end = content.indexOf(endMarker, start);

if (start !== -1 && end !== -1) {
    const replacement = `
          <TabsContent value="overview">
              <OverviewTab 
                  user={user} 
                  filteredAttendances={filteredAttendances} 
                  filteredUsersList={filteredUsersList} 
                  setConfirmDeleteGlobal={setConfirmDeleteGlobal} 
              />
          </TabsContent>
          `;
    const newContent = content.slice(0, start) + replacement + content.slice(end);
    
    // Also import OverviewTab
    const finalContent = newContent.replace(
        'import { BankingStyleDashboardCards } from "../components/BankingStyleDashboardCards";',
        'import { BankingStyleDashboardCards } from "../components/BankingStyleDashboardCards";\nimport { OverviewTab } from "./dashboard/OverviewTab";'
    );
    
    fs.writeFileSync('src/pages/Dashboard.tsx', finalContent);
    console.log("Replacement done");
} else {
    console.log("Could not find markers!");
}
