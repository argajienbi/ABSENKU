import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { UserSquare2, MessageSquare } from "lucide-react";

interface ConfirmAbsenDialogProps {
  confirmData: { method: string; photoBase64: string | null } | null;
  setConfirmData: (data: any) => void;
  type: string;
  submitAttendance: (notes?: string) => void;
  loading: boolean;
}

export function ConfirmAbsenDialog({ confirmData, setConfirmData, type, submitAttendance, loading }: ConfirmAbsenDialogProps) {
  const [notes, setNotes] = useState("");

  if (!confirmData) return null;
  return (
    <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden border-0 animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
            <UserSquare2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Konfirmasi Absen</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Apakah Anda yakin ingin mengirim absen {type === 'in' ? 'Masuk' : type === 'out' ? 'Pulang' : type.replace('_', ' ')} ini ke server?</p>
          
          {confirmData.photoBase64 && (
            <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-inner flex justify-center bg-gray-50 dark:bg-gray-900/50">
              <img src={confirmData.photoBase64} alt="Captured Selfie" className="w-48 h-64 object-cover" />
            </div>
          )}

          <div className="mb-6 text-left">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 mb-2">
              <MessageSquare className="w-3 h-3" /> Keterangan Tambahan
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="(Opsional) Alasan terlambat, lupa absen, dsb."
              className="w-full h-20 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl h-12 text-sm font-bold bg-white dark:bg-gray-800"
              onClick={() => {
                setConfirmData(null);
                setNotes("");
              }}
              disabled={loading}
            >
              Batal
            </Button>
            <Button 
              className="flex-1 rounded-xl h-12 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-lg shadow-teal-500/30"
              onClick={() => submitAttendance(notes)}
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Kirim Absen'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
