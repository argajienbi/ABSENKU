const fs = require('fs');

fs.mkdirSync('src/pages/dashboard', { recursive: true });

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const getChunk = (startMarker, endMarker) => {
   const start = content.indexOf(startMarker);
   if (start === -1) return null;
   const end = endMarker ? content.indexOf(endMarker, start) : content.length;
   return content.slice(start, end).trim();
};

const overviewChunk = getChunk('<TabsContent value="overview"', '<TabsContent value="users"');

fs.writeFileSync('src/pages/dashboard/OverviewTab.tsx', 
`import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../components/ui/dropdown-menu";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../components/ui/table";
import { Download, ChevronDown, Trash2, MapPin } from "lucide-react";
import { BankingStyleDashboardCards } from "../../components/BankingStyleDashboardCards";
import { format } from "date-fns";

export function OverviewTab({ user, filteredAttendances, filteredUsersList, setConfirmDeleteGlobal }: any) {
  return (
    ` + overviewChunk + `
  );
}
`
);

console.log('Overview tab created.');
