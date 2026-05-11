
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  onConfirm: () => void;
  confirmLabel: string;
}

export function ConfirmDeleteDialog({
  open, onOpenChange, title, description, onConfirm, confirmLabel
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 rounded-[2rem] border-0 shadow-2xl overflow-hidden">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black text-rose-600 uppercase tracking-tighter">{title}</DialogTitle>
          <CardDescription className="text-sm font-medium text-slate-500">
            {description}
          </CardDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-slate-200">Batal</Button>
          <Button onClick={onConfirm} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md">{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
