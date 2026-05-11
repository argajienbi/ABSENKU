
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { QRCodeCanvas } from 'qrcode.react';
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import jsPDF from 'jspdf';

interface MemberCardDialogProps {
  selectedUserForCard: any | null;
  setSelectedUserForCard: (user: any | null) => void;
  settings: any;
  shiftsInput: any;
}

export function MemberCardDialog({ selectedUserForCard, setSelectedUserForCard, settings, shiftsInput }: MemberCardDialogProps) {
  return (
    <Dialog open={!!selectedUserForCard} onOpenChange={(open) => !open && setSelectedUserForCard(null)}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-gray-900 border-0 rounded-[2.5rem] shadow-2xl p-0 overflow-hidden outline-none ring-0">
        {selectedUserForCard && (
          <div className="flex flex-col items-center p-8">
            <div 
              id="member-card-print"
              className="bg-white border-0 overflow-hidden relative shadow-2xl flex flex-col items-center"
              style={{ 
                width: '85.6mm', 
                height: '54mm', 
                borderRadius: '4mm',
                fontFamily: 'system-ui, sans-serif'
              }}
            >
               {/* Background Elements */}
               <div className="absolute inset-0 bg-slate-50"></div>
               <div className="absolute top-0 right-0 w-48 h-48 bg-teal-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-600/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

               {/* Header / Top Bar */}
               <div className="h-[9mm] bg-teal-800 flex items-center px-4 relative z-10 w-full shrink-0 border-b-2 border-teal-600">
                  <div className="flex items-center gap-2">
                    {settings?.appLogoUrl ? (
                      <img src={settings.appLogoUrl} className="h-[22px] object-contain brightness-0 invert" alt="Logo" />
                    ) : (
                      <div className="w-[20px] h-[20px] bg-white text-teal-800 rounded flex items-center justify-center shadow-lg">
                        <Briefcase className="w-[12px] h-[12px]" />
                      </div>
                    )}
                    <h1 className="text-[12px] font-black tracking-[0.1em] text-white uppercase ml-1 opacity-95">{settings?.appName || "ABSENKU"}</h1>
                  </div>
               </div>

               {/* Main Content Area */}
               <div className="flex-1 flex w-full relative z-10 items-center pl-3 pr-2 py-1 justify-between">
                  {/* Left: Info & Photo */}
                  <div className="flex gap-4 items-center w-[72%]">
                     {/* Photo */}
                     <div className="w-[22.5mm] h-[28mm] rounded-lg bg-teal-50 border-[2.5px] border-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden shrink-0 flex items-center justify-center">
                       {selectedUserForCard.avatarUrl ? (
                          <img src={selectedUserForCard.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-teal-300 text-4xl">
                            {selectedUserForCard.name ? selectedUserForCard.name[0] : "P"}
                          </div>
                       )}
                     </div>

                     {/* Info Text */}
                     <div className="flex flex-col justify-center pb-1">
                        <div className="mb-[2.5mm]">
                           <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1 line-clamp-2">{selectedUserForCard.name}</h2>
                           <p className="text-[7.5px] font-black text-teal-600 uppercase tracking-widest">{selectedUserForCard.role?.replace(/_/g, ' ') || "EMPLOYEE"}</p>
                        </div>

                        <div className="grid gap-[1.5mm]">
                           <div>
                              <p className="text-[5.5px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">ID KARYAWAN</p>
                              <p className="text-[9px] font-bold text-slate-800 leading-none">{selectedUserForCard.uniqueId || "-"}</p>
                           </div>
                           <div>
                              <p className="text-[5.5px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">JADWAL SHIFT</p>
                              <p className="text-[8px] font-bold text-slate-800 leading-none">
                                  {selectedUserForCard.shiftId ? shiftsInput[selectedUserForCard.shiftId]?.name || "CUSTOM" : "TIDAK ADA SHIFT"}
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right: QR Code */}
                  <div className="w-[28%] flex flex-col items-center justify-center pr-2 border-l border-slate-200/60 pl-3 py-1">
                      <div className="bg-white p-1 rounded border border-slate-200 shadow-sm w-[21mm] h-[21mm] flex items-center justify-center">
                        <QRCodeCanvas value={selectedUserForCard.id} style={{ width: '100%', height: '100%' }} level="Q" />
                      </div>
                      <p className="text-[4px] font-black text-slate-400 uppercase mt-1 tracking-widest text-center">{selectedUserForCard.id.slice(0, 10)}</p>
                  </div>
               </div>

               {/* Footer Bar */}
               <div className="h-[3.5mm] bg-teal-900 flex items-center px-4 justify-between relative z-10 w-full shrink-0">
                  <p className="text-[4.5px] font-bold text-teal-100/70 uppercase tracking-widest">KARTU TANDA PENGENAL (KTP)</p>
                  <p className="text-[4.5px] font-bold text-teal-100/70 uppercase tracking-widest">HARAP DIKEMBALIKAN JIKA DITEMUKAN</p>
               </div>
            </div>

            <div className="flex justify-between gap-4 w-full mt-8 max-w-[85.6mm]">
              <Button variant="ghost" className="flex-1 text-slate-400 dark:text-gray-500 font-bold tracking-widest uppercase text-xs hover:text-rose-500 transition-colors h-12 rounded-2xl" onClick={() => setSelectedUserForCard(null)}>Batal</Button>
              <Button onClick={async () => {
                const el = document.getElementById("member-card-print");
                if (!el) return;
                toast.info("Menyiapkan dokumen...", { id: 'print-id' });
                try {
                  await new Promise(r => setTimeout(r, 250));
                  const url = await toPng(el, { cacheBust: true, pixelRatio: 3 });
                  const pdf = new jsPDF({
                    orientation: "landscape",
                    unit: "mm",
                    format: [85.6, 54]
                  });
                  pdf.addImage(url, 'PNG', 0, 0, 85.6, 54);
                  pdf.save(`IDCard_${selectedUserForCard.name?.replace(/\s+/g, '_') || 'Karyawan'}.pdf`);
                  toast.dismiss();
                  toast.success("Berhasil mengunduh dokumen", { id: 'print-id' });
                } catch (e) {
                  toast.dismiss();
                  console.error("Print error", e);
                  toast.error("Gagal mengunduh kartu", { id: 'print-id' });
                }
              }} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black tracking-widest uppercase text-xs h-12 shadow-lg shadow-teal-600/20 rounded-2xl active:scale-95 transition-all">UNDUH KARTU (PDF)</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
