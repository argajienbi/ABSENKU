import React from 'react';
import { Card, CardTitle } from "../components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';
import { format } from "date-fns";

export const PerformanceAnalytics = ({ attendances, usersList }: { attendances: any[], usersList: any[] }) => {
  
  // Basic heatmap representation: Count activity by hour
  const hoursData = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  attendances.forEach(a => {
    const hour = new Date(a.timestamp).getHours();
    hoursData[hour].count++;
  });

  // Productivity/Lateness: Simple count of 'in' vs 'out'
  const inCount = attendances.filter(a => a.type === 'in').length;
  const outCount = attendances.filter(a => a.type === 'out').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6">
        <CardTitle className="text-sm font-black text-teal-900 mb-4 uppercase tracking-widest">Attendance Heatmap (Hourly Activity)</CardTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hoursData}>
            <XAxis dataKey="hour" />
            <Tooltip />
            <Bar dataKey="count" fill="#0d9488" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card className="p-6">
        <CardTitle className="text-sm font-black text-teal-900 mb-4 uppercase tracking-widest">Summary</CardTitle>
        <div className="text-xs space-y-2">
            <div>Total In: {inCount}</div>
            <div>Total Out: {outCount}</div>
            <div>Active Users: {usersList.length}</div>
        </div>
      </Card>
    </div>
  );
};
