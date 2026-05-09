const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const s1 = content.indexOf('<TabsContent value="settings"');
const s2 = content.indexOf('</TabsContent>', s1) + '</TabsContent>'.length;

const chunk = content.slice(s1, s2);

fs.writeFileSync('src/pages/dashboard/SettingsTab.tsx', 
`import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { MapPin, Plus, Trash2, Clock, Map, Settings2, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../../components/ui/dialog";

export function SettingsTab({
  settings, loadingConfig, appNameInput, setAppNameInput, 
  appLogoUrlInput, setAppLogoUrlInput, fcmVapidKeyInput, setFcmVapidKeyInput,
  googleMapsApiKeyInput, setGoogleMapsApiKeyInput, shiftsInput, setShiftsInput,
  holidaysInput, setHolidaysInput, areasInput, setAreasInput,
  newAreaLatInput, setNewAreaLatInput, newAreaLngInput, setNewAreaLngInput,
  newArea, setNewArea, editingAreaId, setEditingAreaId, newHoliday, setNewHoliday,
  toggleGeofence, saveSettings, user, idRefsList
}: any) {
  return (
    ` + chunk.replace(/<TabsContent value="settings"[^>]*>/, '<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">').replace(/<\/TabsContent>/g, '</div>') + `
  );
}
`
);

// Delete the bad extract
// Now update the Dashboard.tsx
const replacement = `
          <TabsContent value="settings">
              <SettingsTab
                  settings={settings} loadingConfig={loadingConfig} appNameInput={appNameInput}
                  setAppNameInput={setAppNameInput} appLogoUrlInput={appLogoUrlInput}
                  setAppLogoUrlInput={setAppLogoUrlInput} fcmVapidKeyInput={fcmVapidKeyInput}
                  setFcmVapidKeyInput={setFcmVapidKeyInput} googleMapsApiKeyInput={googleMapsApiKeyInput}
                  setGoogleMapsApiKeyInput={setGoogleMapsApiKeyInput} shiftsInput={shiftsInput}
                  setShiftsInput={setShiftsInput} holidaysInput={holidaysInput}
                  setHolidaysInput={setHolidaysInput} areasInput={areasInput}
                  setAreasInput={setAreasInput} newAreaLatInput={newAreaLatInput}
                  setNewAreaLatInput={setNewAreaLatInput} newAreaLngInput={newAreaLngInput}
                  setNewAreaLngInput={setNewAreaLngInput} newArea={newArea}
                  setNewArea={setNewArea} editingAreaId={editingAreaId}
                  setEditingAreaId={setEditingAreaId} newHoliday={newHoliday}
                  setNewHoliday={setNewHoliday} toggleGeofence={toggleGeofence}
                  saveSettings={handleSaveSettings || saveSettings} user={user} idRefsList={idRefsList}
              />
          </TabsContent>
`;

let newContent = content.slice(0, s1) + replacement.trim() + content.slice(s2);

newContent = newContent.replace(
    'import { AnnouncementsTab } from "./dashboard/AnnouncementsTab";',
    'import { AnnouncementsTab } from "./dashboard/AnnouncementsTab";\nimport { SettingsTab } from "./dashboard/SettingsTab";'
);

// We should fix handleSaveSettings vs saveSettings
newContent = newContent.replace(/handleSaveSettings \|\| saveSettings/g, 'saveSettings');

fs.writeFileSync('src/pages/Dashboard.tsx', newContent);

console.log("Extracted settings");
