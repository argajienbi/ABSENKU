import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Clock, Calendar, MapPin, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { useSettings } from "@/lib/settingsObject";

export const BankingStyleDashboardCards = ({ attendances = [], usersList = [] }: { attendances?: any[], usersList?: any[] }) => {
  const settings = useSettings();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = now.toDateString();
  const todayAttendances = attendances.filter(a => new Date(a.timestamp).toDateString() === today);
  const presentCount = new Set(todayAttendances.filter(a => a.type === 'in').map(a => a.userId)).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[
        { title: "Current Time", value: format(now, "HH:mm:ss"), icon: Clock, color: "from-blue-500 to-indigo-600" },
        { title: "Date", value: format(now, "dd MMM yyyy"), icon: Calendar, color: "from-teal-500 to-emerald-600" },
        { title: "Present Today", value: `${presentCount} / ${usersList.length || 0}`, icon: Briefcase, color: "from-purple-500 to-violet-600" },
        { title: "Total Users", value: usersList.length.toString(), icon: MapPin, color: "from-amber-500 to-orange-600" },
      ].map((card, i) => (
        <Card key={i} className="relative overflow-hidden border-0 shadow-lg group rounded-3xl">
          {/* Abstract Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-90`} />
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <card.icon className="w-24 h-24 text-white" />
          </div>
          
          <div className="relative p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <card.icon className="w-5 h-5 text-white/80" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">{card.title}</span>
            </div>
            <div className="text-3xl font-black tracking-tight">{card.value}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};
