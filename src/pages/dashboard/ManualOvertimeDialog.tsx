
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { CardDescription } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

interface ManualOvertimeDialogProps {
  showOvertimeModal: boolean;
  setShowOvertimeModal: (show: boolean) => void;
  overtimeUser: any;
  overtimeDate: string;
  setOvertimeDate: (date: string) => void;
  overtimeStartTime: string;
  setOvertimeStartTime: (time: string) => void;
  overtimeEndTime: string;
  setOvertimeEndTime: (time: string) => void;
  overtimeNotes: string;
  setOvertimeNotes: (notes: string) => void;
  saveManualOvertime: () => void;
}

export function ManualOvertimeDialog({
  showOvertimeModal, setShowOvertimeModal, overtimeUser,
  overtimeDate, setOvertimeDate, overtimeStartTime, setOvertimeStartTime,
  overtimeEndTime, setOvertimeEndTime, overtimeNotes, setOvertimeNotes,
  saveManualOvertime
}: ManualOvertimeDialogProps) {
  return (
    <Dialog open={showOvertimeModal} onOpenChange={(open) => !open && setShowOvertimeModal(false)}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-0 shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-black text-amber-900 dark:text-amber-50 uppercase tracking-tighter">Tambah Lembur Manual</DialogTitle>
          <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Atur waktu lembur user dari sistem</CardDescription>
        </DialogHeader>
        {overtimeUser && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Nama User</Label>
              <Input 
                disabled
                value={overtimeUser.name} 
                className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50 opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Tanggal</Label>
              <Input 
                type="date"
                value={overtimeDate} 
                onChange={(e) => setOvertimeDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Mulai</Label>
                <Input 
                  type="time"
                  value={overtimeStartTime} 
                  onChange={(e) => setOvertimeStartTime(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Sampai</Label>
                <Input 
                  type="time"
                  value={overtimeEndTime} 
                  onChange={(e) => setOvertimeEndTime(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Keterangan</Label>
              <Input 
                value={overtimeNotes} 
                onChange={(e) => setOvertimeNotes(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1 text-slate-400 font-bold uppercase text-xs h-12 rounded-2xl" onClick={() => setShowOvertimeModal(false)}>Batal</Button>
              <Button onClick={saveManualOvertime} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black tracking-widest uppercase text-xs h-12 shadow-lg shadow-amber-600/20 rounded-2xl active:scale-95 transition-all">SIMPAN LEMBUR</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
