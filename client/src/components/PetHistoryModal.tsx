import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, User, AlertCircle, Package, DollarSign, FileText, Download, Eye, X } from "lucide-react";
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
  petBreed?: string;
  petSize?: string;
  clientName?: string;
  petPhoto?: string;
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
  petBreed,
  petSize,
  clientName,
  petPhoto,
  visits = [],
}: PetHistoryModalProps) {
  const totalVisits = visits.length;
  const lastVisit = visits.length > 0 ? visits[0] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Histórico do Pet</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pet Header */}
          <div className="flex gap-4 pb-4 border-b border-accent/10">
            {/* Pet Photo */}
            <div className="flex-shrink-0">
              {petPhoto ? (
                <img
                  src={petPhoto}
                  alt={petName}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-accent/10 flex items-center justify-center text-3xl font-bold text-accent">
                  {petName?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>

            {/* Pet Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-foreground">{petName}</h3>
                <span className="text-sm text-muted-foreground">{petBreed}</span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">🐕 Porte</span>
                  <span className="text-sm font-medium text-foreground">{petSize || "Não informado"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">👤 Cliente</span>
                  <span className="text-sm font-medium text-foreground">{clientName || "Não informado"}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total de Visitas</p>
                    <p className="text-lg font-bold text-foreground">{totalVisits}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Última Visita</p>
                    <p className="text-sm font-medium text-foreground">
                      {lastVisit ? format(new Date(lastVisit.date), "dd/MM/yyyy", { locale: ptBR }) : "Sem visita"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pacote</p>
                    <Badge className="mt-1" variant="outline">
                      {lastVisit?.packageName || "Ativo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* History Title */}
          <div>
            <h4 className="font-bold text-foreground mb-4">Histórico de Visitas</h4>

            {/* Timeline */}
            <div className="space-y-4">
              {visits && visits.length > 0 ? (
                visits.map((visit, index) => (
                  <div key={visit.id} className="flex gap-4">
                    {/* Timeline Dot */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-accent mt-1.5" />
                      {index < visits.length - 1 && (
                        <div className="w-0.5 h-16 bg-accent/20 my-1" />
                      )}
                    </div>

                    {/* Visit Card */}
                    <Card className="flex-1 p-4 border-l-4 border-l-accent">
                      {/* Date and Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {format(new Date(visit.date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({format(new Date(visit.date), "EEEE", { locale: ptBR })})
                          </p>
                        </div>
                        <Badge className={STATUS_COLORS[visit.status]}>
                          {STATUS_LABELS[visit.status]}
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {/* Service */}
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Serviço</p>
                            <p className="text-sm font-medium text-foreground">{visit.service}</p>
                          </div>
                        </div>

                        {/* Professional */}
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Responsável</p>
                            <p className="text-sm font-medium text-foreground">{visit.professional}</p>
                          </div>
                        </div>

                        {/* Package */}
                        {visit.packageName && (
                          <div className="flex items-start gap-2">
                            <Package className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Pacote</p>
                              <p className="text-sm font-medium text-foreground">{visit.packageName}</p>
                            </div>
                          </div>
                        )}

                        {/* Value */}
                        {visit.value && (
                          <div className="flex items-start gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Valor / Pacote</p>
                              <p className="text-sm font-medium text-foreground">R$ {visit.value.toFixed(2)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {visit.notes && (
                        <div className="flex items-start gap-2 pt-3 border-t border-accent/10">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Observações</p>
                            <p className="text-sm text-foreground">{visit.notes}</p>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhuma visita registrada</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-accent/10">
            <Button variant="outline" className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              Ver ficha completa
            </Button>
            <Button className="flex-1 bg-accent hover:bg-accent/90">
              <Download className="w-4 h-4 mr-2" />
              Exportar Histórico
            </Button>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
