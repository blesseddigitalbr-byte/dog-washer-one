import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, AlertCircle, Package, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Visit {
  id: string;
  date: Date;
  service: string;
  professional: string;
  status: "completed" | "pending" | "cancelled";
  notes?: string;
  beforePhoto?: string;
  afterPhoto?: string;
  intercurrences?: string;
  packageId?: string;
  packageName?: string;
  value?: number;
}

interface PetHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  visits: Visit[];
}

const STATUS_COLORS = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  completed: "Concluído",
  pending: "Pendente",
  cancelled: "Cancelado",
};

export function PetHistoryModal({
  isOpen,
  onClose,
  petName,
  visits,
}: PetHistoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Visitas - {petName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {visits && visits.length > 0 ? (
            visits.map((visit) => (
              <div
                key={visit.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-accent flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {format(new Date(visit.date), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">{visit.service}</p>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[visit.status]}>
                    {STATUS_LABELS[visit.status]}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Professional */}
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Profissional</p>
                      <p className="text-sm font-medium text-foreground">
                        {visit.professional}
                      </p>
                    </div>
                  </div>

                  {/* Value */}
                  {visit.value && (
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="text-sm font-medium text-foreground">
                          R$ {visit.value.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Package */}
                {visit.packageName && (
                  <div className="flex items-start gap-2 mb-4">
                    <Package className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pacote</p>
                      <p className="text-sm font-medium text-foreground">
                        {visit.packageName}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {visit.notes && (
                  <div className="mb-4 bg-accent/5 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3" />
                      Observações
                    </p>
                    <p className="text-sm text-foreground">{visit.notes}</p>
                  </div>
                )}

                {/* Intercurrences */}
                {visit.intercurrences && (
                  <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-xs text-red-700 flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3 h-3" />
                      Intercorrências
                    </p>
                    <p className="text-sm text-red-800">{visit.intercurrences}</p>
                  </div>
                )}

                {/* Photos */}
                {(visit.beforePhoto || visit.afterPhoto) && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {visit.beforePhoto && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Foto Antes</p>
                        <img
                          src={visit.beforePhoto}
                          alt="Antes"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    {visit.afterPhoto && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Foto Depois</p>
                        <img
                          src={visit.afterPhoto}
                          alt="Depois"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma visita registrada</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
