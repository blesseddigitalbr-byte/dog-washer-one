import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertCircle, Loader2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  itemName: string;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <AlertDialogTitle className="text-red-600">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-2">
            <p className="text-foreground font-semibold mb-1">Tem certeza que deseja deletar?</p>
            <p className="text-muted-foreground">{description}</p>
            <p className="text-sm text-red-600 mt-2">
              <strong>{itemName}</strong> será removido permanentemente.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Deletar
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
