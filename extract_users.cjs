const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const getChunk = (startMarker, endMarker) => {
   const start = content.indexOf(startMarker);
   if (start === -1) return null;
   const end = endMarker ? content.indexOf(endMarker, start) : content.length;
   return content.slice(start, end).trim();
};

const usersChunk = getChunk('<TabsContent value="users"', '<TabsContent value="announcements"');

fs.writeFileSync('src/pages/dashboard/UsersTab.tsx', 
`import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../components/ui/dropdown-menu";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../components/ui/table";
import { Download, ChevronDown, Trash2, MapPin, Search } from "lucide-react";
import { Input } from "../../components/ui/input";

export function UsersTab({
  user, filteredUsersList, setDeleteUserTarget, setSelectedUserForEdit, 
  setSelectedUserForCard, setKoreksiUser, setShowKoreksiModal,
  setOvertimeUser, setShowOvertimeModal, setEditName, setEditRole, 
  setEditShift, setEditUniqueId, setEditArea, setEditIsBanned, 
  setEditWorkStartDate, setEditWorkEndDate, setEditMonthlyShifts, 
  setEditWeeklyShiftPattern, setEditShiftMode, settings, handleEditUser
}: any) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const displayUsers = filteredUsersList.filter((u: any) => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.uniqueId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    ` + usersChunk + `
  );
}
`
);

let usersFileContent = fs.readFileSync('src/pages/dashboard/UsersTab.tsx', 'utf-8');
usersFileContent = usersFileContent.replace(/<TabsContent value="users"[^>]*>/, '<div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">');
usersFileContent = usersFileContent.replace(/<\/TabsContent>/g, '</div>');

fs.writeFileSync('src/pages/dashboard/UsersTab.tsx', usersFileContent);

console.log('Users tab created.');
