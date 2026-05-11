
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { CardDescription } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

interface KoreksiAlpaDialogProps {
  showKoreksiModal: boolean;
  setShowKoreksiModal: (show: boolean) => void;
  koreksiUser: any;
  koreksiDate: string;
  setKoreksiDate: (date: string) => void;
  koreksiNotes: string;
  setKoreksiNotes: (notes: string) => void;
  submitKoreksiAlpa: () => void;
}

export function KoreksiAlpaDialog({
  showKoreksiModal, setShowKoreksiModal, koreksiUser,
  koreksiDate, setKoreksiDate, koreksiNotes, setKoreksiNotes,
  submitKoreksiAlpa
}: KoreksiAlpaDialogProps) {
  return (
    <Dialog open={showKoreksiModal} onOpenChange={(open) => !open && setShowKoreksiModal(false)}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-0 shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-black text-amber-900 dark:text-amber-50 uppercase tracking-tighter">Koreksi Kehadiran / Dispensasi</DialogTitle>
          <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tambahkan riwayat untuk koreksi alpa</CardDescription>
        </DialogHeader>
        {koreksiUser && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Nama User</Label>
              <Input 
                disabled
                value={koreksiUser.name} 
                className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50 opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Tanggal Dispensasi</Label>
              <Input 
                type="date"
                value={koreksiDate} 
                onChange={(e) => setKoreksiDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Keterangan Tambahan</Label>
              <Input 
                value={koreksiNotes} 
                onChange={(e) => setKoreksiNotes(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1 text-slate-400 font-bold uppercase text-xs h-12 rounded-2xl" onClick={() => setShowKoreksiModal(false)}>Batal</Button>
              <Button onClick={submitKoreksiAlpa} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black tracking-widest uppercase text-xs h-12 shadow-lg shadow-amber-600/20 rounded-2xl active:scale-95 transition-all">SIMPAN KOREKSI</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
