const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const startMarker = '<TabsContent value="users"';
const endMarker = '<TabsContent value="announcements"';

const start = content.indexOf(startMarker);
const end = content.indexOf(endMarker, start);

if (start !== -1 && end !== -1) {
    const replacement = `
          <TabsContent value="users">
              <UsersTab 
                  user={user} 
                  filteredUsersList={filteredUsersList} 
                  setDeleteUserTarget={setDeleteUserTarget}
                  setSelectedUserForEdit={setSelectedUserForEdit}
                  setSelectedUserForCard={setSelectedUserForCard}
                  setKoreksiUser={setKoreksiUser}
                  setShowKoreksiModal={setShowKoreksiModal}
                  setOvertimeUser={setOvertimeUser}
                  setShowOvertimeModal={setShowOvertimeModal}
                  setEditName={setEditName}
                  setEditRole={setEditRole}
                  setEditShift={setEditShift}
                  setEditUniqueId={setEditUniqueId}
                  setEditArea={setEditArea}
                  setEditIsBanned={setEditIsBanned}
                  setEditWorkStartDate={setEditWorkStartDate}
                  setEditWorkEndDate={setEditWorkEndDate}
                  setEditMonthlyShifts={setEditMonthlyShifts}
                  setEditWeeklyShiftPattern={setEditWeeklyShiftPattern}
                  setEditShiftMode={setEditShiftMode}
                  settings={settings}
                  shiftsInput={shiftsInput}
                  areasInput={areasInput}
                  handleEditUser={handleEditUser}
                  handleKoreksiAlpa={handleKoreksiAlpa}
                  handleAddManualOvertime={handleAddManualOvertime}
              />
          </TabsContent>
          `;
    const newContent = content.slice(0, start) + replacement + content.slice(end);
    
    // Also import UsersTab
    const finalContent = newContent.replace(
        'import { OverviewTab } from "./dashboard/OverviewTab";',
        'import { OverviewTab } from "./dashboard/OverviewTab";\nimport { UsersTab } from "./dashboard/UsersTab";'
    );
    
    fs.writeFileSync('src/pages/Dashboard.tsx', finalContent);
    console.log("Replacement users done");
} else {
    console.log("Could not find markers!");
}
