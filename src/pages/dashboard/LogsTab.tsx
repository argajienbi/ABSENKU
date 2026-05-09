import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { ShieldAlert, AlertCircle, Ban, Search } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

export function LogsTab({ securityLogs }: any) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
                <Card className="border-0 shadow-lg shadow-teal-900/5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-8 rounded-3xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                         <ShieldAlert className="w-6 h-6 text-rose-500" />
                         Peringatan & Log Keamanan
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                        Catatan sistem terkait login perangkat ganda dan isu keamanan lainnya. (Fitur Khusus Superadmin)
                      </p>
                    </div>
                  </div>


                <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50/80 dark:bg-gray-800/80">
                      <TableRow>
                        <TableHead className="w-[180px] font-bold text-slate-700">Waktu</TableHead>
                        <TableHead className="font-bold text-slate-700">Judul</TableHead>
                        <TableHead className="font-bold text-slate-700">Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityLogs.length > 0 ? securityLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-rose-50/50 dark:hover:bg-rose-900/10">
                          <TableCell className="font-medium">
                            {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                               <ShieldAlert className="w-3 h-3" />
                               {log.title}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-gray-300">
                            {log.body}
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                            Tidak ada log peringatan keamanan yang tercatat.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
  );
}
