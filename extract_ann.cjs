const fs = require('fs');

const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const getChunk = (startMarker, endMarker) => {
   const start = content.indexOf(startMarker);
   if (start === -1) return null;
   const end = endMarker ? content.indexOf(endMarker, start) : content.length;
   return content.slice(start, end).trim();
};

const annChunk = getChunk('<TabsContent value="announcements"', '<TabsContent value="analytics"');

fs.writeFileSync('src/pages/dashboard/AnnouncementsTab.tsx', 
`import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Trash2 } from "lucide-react";

export function AnnouncementsTab({
  announcementTitle, setAnnouncementTitle,
  announcementContent, setAnnouncementContent,
  announcementType, setAnnouncementType,
  announcements, handleAddAnnouncement, handleDeleteAnnouncement
}: any) {
  return (
    ` + annChunk + `
  );
}
`
);

let annFileContent = fs.readFileSync('src/pages/dashboard/AnnouncementsTab.tsx', 'utf-8');
annFileContent = annFileContent.replace(/<TabsContent value="announcements"[^>]*>/, '<div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">');
annFileContent = annFileContent.replace(/<\/TabsContent>/g, '</div>');

fs.writeFileSync('src/pages/dashboard/AnnouncementsTab.tsx', annFileContent);
console.log('Ann tab created.');
