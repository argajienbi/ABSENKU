import React from 'react';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Briefcase, CalendarDays, LogOut } from "lucide-react";
import { format } from "date-fns";

export function SettingsShiftTab({
  loadingConfig, shiftsInput, setShiftsInput,
  holidaysInput, setHolidaysInput, newHoliday, setNewHoliday,
  saveSettings
}: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 flex flex-col">
        <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Shift & Working Days Management
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(shiftsInput || {}).map(([id, shift]: [string, any]) => (
            <div key={id} className="bg-teal-50/50 dark:bg-teal-900/20 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/50 space-y-4">
              <div className="flex justify-between items-center text-teal-700 dark:text-teal-300">
                <Input 
                  value={shift.name} 
                  onChange={(e) => {
                    const newShifts = {...shiftsInput};
                    newShifts[id].name = e.target.value;
                    setShiftsInput(newShifts);
                  }}
                  className="bg-transparent border-0 font-black uppercase p-0 h-auto focus-visible:ring-0 text-sm w-32"
                />
                <div className="flex gap-2 items-center">
                  <Input 
                    type="color" 
                    value={shift.color} 
                    onChange={(e) => {
                      const newShifts = {...shiftsInput};
                      newShifts[id].color = e.target.value;
                      setShiftsInput(newShifts);
                    }}
                    className="w-8 h-8 rounded-full border-0 p-0 pointer cursor-pointer"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      const newShifts = {...shiftsInput};
                      delete newShifts[id];
                      setShiftsInput(newShifts);
                    }}
                  >
                    <LogOut className="w-4 h-4 rotate-45" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-500">Jam Masuk</Label>
                  <Input 
                    type="time" 
                    value={shift.startTime || "08:00"} 
                    onChange={(e) => {
                      const newShifts = {...shiftsInput};
                      newShifts[id].startTime = e.target.value;
                      setShiftsInput(newShifts);
                    }}
                    className="h-8 py-1 text-[10px] px-2 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-500">Jam Pulang</Label>
                  <Input 
                    type="time" 
                    value={shift.endTime || "17:00"} 
                    onChange={(e) => {
                      const newShifts = {...shiftsInput};
                      newShifts[id].endTime = e.target.value;
                      setShiftsInput(newShifts);
                    }}
                    className="h-8 py-1 text-[10px] px-2 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-500">Toleransi (M)</Label>
                  <Input 
                    type="number" 
                    value={shift.gracePeriod || 0} 
                    onChange={(e) => {
                      const newShifts = {...shiftsInput};
                      newShifts[id].gracePeriod = Number(e.target.value);
                      setShiftsInput(newShifts);
                    }}
                    className="h-8 py-1 text-[10px] px-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-teal-100/50">
                {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((dayName, idx) => {
                  const workDay = shift.workDays[idx];
                  return (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-500 w-16">{dayName}</span>
                      <div className="flex gap-2 items-center flex-1 justify-end">
                        {workDay ? (
                          <>
                            <Input 
                              type="time" 
                              value={workDay.start} 
                              onChange={(e) => {
                                const newShifts = {...shiftsInput};
                                newShifts[id].workDays[idx].start = e.target.value;
                                setShiftsInput(newShifts);
                              }}
                              className="h-7 py-1 text-[10px] w-20 px-2 rounded-lg"
                            />
                            <span>-</span>
                            <Input 
                              type="time" 
                              value={workDay.end} 
                              onChange={(e) => {
                                const newShifts = {...shiftsInput};
                                newShifts[id].workDays[idx].end = e.target.value;
                                setShiftsInput(newShifts);
                              }}
                              className="h-7 py-1 text-[10px] w-20 px-2 rounded-lg"
                            />
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-rose-500"
                              onClick={() => {
                                const newShifts = {...shiftsInput};
                                newShifts[id].workDays[idx] = null;
                                setShiftsInput(newShifts);
                              }}
                            ><LogOut className="w-3 h-3"/></Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[10px] uppercase font-black px-4 rounded-lg bg-white"
                            onClick={() => {
                              const newShifts = {...shiftsInput};
                              newShifts[id].workDays[idx] = { start: "08:00", end: "16:00" };
                              setShiftsInput(newShifts);
                            }}
                          >SET LIBUR</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <button 
            onClick={() => {
              const newId = `shift_${Date.now()}`;
              setShiftsInput({
                ...shiftsInput,
                [newId]: {
                  name: "New Shift",
                  label: "Custom",
                  color: "#64748b",
                  startTime: "08:00",
                  endTime: "16:00",
                  gracePeriod: 0,
                  workDays: {
                    0: null,
                    1: { start: "08:00", end: "16:00" },
                    2: { start: "08:00", end: "16:00" },
                    3: { start: "08:00", end: "16:00" },
                    4: { start: "08:00", end: "16:00" },
                    5: { start: "08:00", end: "16:00" },
                    6: null
                  }
                }
              });
            }}
            className="border-2 border-dashed border-teal-200 dark:border-teal-900/50 rounded-2xl flex flex-col items-center justify-center p-8 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all gap-2"
          >
            <Briefcase className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">Tambah Shift Baru</span>
          </button>
        </div>
        <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-8 transition-all active:scale-95">
          SIMPAN PENGATURAN SHIFT
        </Button>
      </Card>

      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
        <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Manual Holiday Table (Overwrites Automatic)
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input 
              type="date" 
              value={newHoliday} 
              onChange={(e) => setNewHoliday(e.target.value)}
              className="border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-900 h-10 text-sm font-bold rounded-xl"
            />
            <Button 
              onClick={() => {
                if (newHoliday && !holidaysInput.includes(newHoliday)) {
                  setHolidaysInput([...holidaysInput, newHoliday].sort());
                  setNewHoliday("");
                }
              }}
              className="bg-teal-500 hover:bg-teal-600 rounded-xl font-bold uppercase tracking-widest text-[10px] px-6"
            >TAMBAH LIBUR</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {holidaysInput?.map((h: string) => (
              <div key={h} className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2">
                {format(new Date(h), "dd MMM yyyy")}
                <button onClick={() => setHolidaysInput(holidaysInput.filter((d: string) => d !== h))} className="hover:text-rose-800">
                  <LogOut className="w-3 h-3 rotate-45" />
                </button>
              </div>
            ))}
            {(!holidaysInput || holidaysInput.length === 0) && <p className="text-xs text-slate-400 italic">Belum ada hari libur manual yang ditambahkan.</p>}
          </div>
          <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-4 transition-all active:scale-95">
            SIMPAN DAFTAR LIBUR
          </Button>
        </div>
      </Card>
    </div>
  );
}
