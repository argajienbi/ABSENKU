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
  
  const uniqueInUsers = new Set(attendances.filter(a => a.type === 'in').map(a => a.userId)).size;
  const totalUsers = usersList.length;
  const progressPercent = totalUsers > 0 ? Math.round((uniqueInUsers / totalUsers) * 100) : 0;

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
        <div className="text-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total In</p>
                <p className="text-2xl font-black text-teal-600">{inCount}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Out</p>
                <p className="text-2xl font-black text-orange-600">{outCount}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between items-end mb-2">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Attendance Progress</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{uniqueInUsers} / {totalUsers} Users</p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-teal-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-right text-xs font-bold mt-1 text-teal-600">{progressPercent}% Completed</p>
            </div>
        </div>
      </Card>
    </div>
  );
};
