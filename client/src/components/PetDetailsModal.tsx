import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, AlertCircle, Syringe, Bug, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PetDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: {
    id: string;
    name: string;
    breed: string;
    species?: string;
    color?: string;
    weight?: number;
    birthDate?: string;
    microchip?: string;
    porte?: string;
    pelagem?: string;
    vaccines?: string[];
    dewormed?: boolean;
    hasDiseasesOrAllergies?: boolean;
    diseasesOrAllergiesDescription?: string;
    notes?: string;
    photoUrl?: string;
    status?: string;
  };
  clientName?: string;
}

export function PetDetailsModal({
  isOpen,
  onClose,
  pet,
  clientName,
}: PetDetailsModalProps) {
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return "Não informado";
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 + " anos";
    }
    return age + " anos";
  };

  const parseVaccines = (vaccinesStr?: string) => {
    if (!vaccinesStr) return [];
    try {
      return JSON.parse(vaccinesStr);
    } catch {
      return vaccinesStr.split(",").map((v) => v.trim());
    }
  };

  const vaccines = parseVaccines(pet.vaccines as any);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Detalhes do Pet</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pet Header */}
          <div className="flex gap-4 pb-4 border-b border-accent/10">
            {/* Pet Photo */}
            <div className="flex-shrink-0">
              {pet.photoUrl ? (
                <img
                  src={pet.photoUrl}
                  alt={pet.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-accent/10 flex items-center justify-center text-5xl font-bold text-accent">
                  {pet.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>

            {/* Pet Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold text-foreground">{pet.name}</h3>
                <Badge variant="outline" className="bg-accent/10 text-accent">
                  {pet.status || "Ativo"}
                </Badge>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Raça</p>
                  <p className="text-sm font-medium text-foreground">{pet.breed || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Espécie</p>
                  <p className="text-sm font-medium text-foreground">{pet.species || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cor</p>
                  <p className="text-sm font-medium text-foreground">{pet.color || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Idade</p>
                  <p className="text-sm font-medium text-foreground">{calculateAge(pet.birthDate)}</p>
                </div>
              </div>

              {clientName && (
                <div className="mt-4 pt-4 border-t border-accent/10">
                  <p className="text-xs text-muted-foreground">Tutor</p>
                  <p className="text-sm font-medium text-foreground">{clientName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="health">Saúde</TabsTrigger>
              <TabsTrigger value="notes">Observações</TabsTrigger>
            </TabsList>

            {/* Informações Tab */}
            <TabsContent value="info" className="space-y-4">
              <Card className="p-4">
                <h4 className="font-semibold text-foreground mb-4">Dados Físicos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="text-sm font-medium text-foreground">
                      {pet.weight ? `${pet.weight} kg` : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                    <p className="text-sm font-medium text-foreground">
                      {pet.birthDate
                        ? format(new Date(pet.birthDate), "dd/MM/yyyy", { locale: ptBR })
                        : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Porte</p>
                    <p className="text-sm font-medium text-foreground">{pet.porte || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pelagem</p>
                    <p className="text-sm font-medium text-foreground">{pet.pelagem || "Não informado"}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-foreground mb-4">Identificação</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Microchip</p>
                    <p className="text-sm font-medium text-foreground font-mono">
                      {pet.microchip || "Não informado"}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Saúde Tab */}
            <TabsContent value="health" className="space-y-4">
              {/* Vacinas */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Syringe className="w-5 h-5 text-accent" />
                  <h4 className="font-semibold text-foreground">Vacinas</h4>
                </div>
                <div className="space-y-2">
                  {vaccines && vaccines.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {vaccines.map((vaccine: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ✓ {vaccine}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma vacina registrada</p>
                  )}
                </div>
              </Card>

              {/* Vermífugo */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Bug className="w-5 h-5 text-accent" />
                  <h4 className="font-semibold text-foreground">Vermífugo</h4>
                </div>
                <div className="flex items-center gap-2">
                  {pet.dewormed ? (
                    <>
                      <Badge className="bg-green-100 text-green-800">✓ Realizado</Badge>
                      <p className="text-sm text-muted-foreground">Pet foi vermifugado</p>
                    </>
                  ) : (
                    <>
                      <Badge className="bg-yellow-100 text-yellow-800">✗ Pendente</Badge>
                      <p className="text-sm text-muted-foreground">Vermífugo ainda não realizado</p>
                    </>
                  )}
                </div>
              </Card>

              {/* Doenças/Alergias */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-accent" />
                  <h4 className="font-semibold text-foreground">Doenças/Alergias</h4>
                </div>
                {pet.hasDiseasesOrAllergies ? (
                  <div className="space-y-2">
                    <Badge className="bg-red-100 text-red-800">⚠ Possui restrições</Badge>
                    {pet.diseasesOrAllergiesDescription && (
                      <p className="text-sm text-foreground bg-red-50 p-3 rounded-lg border border-red-200">
                        {pet.diseasesOrAllergiesDescription}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <Badge className="bg-green-100 text-green-800">✓ Sem restrições</Badge>
                    <p className="text-sm text-muted-foreground">Pet não possui doenças ou alergias conhecidas</p>
                  </>
                )}
              </Card>
            </TabsContent>

            {/* Observações Tab */}
            <TabsContent value="notes" className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-accent" />
                  <h4 className="font-semibold text-foreground">Observações Gerais</h4>
                </div>
                {pet.notes ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-accent/5 p-3 rounded-lg border border-accent/10">
                    {pet.notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma observação registrada</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-accent/10">
            <Button onClick={onClose} className="flex-1 bg-accent hover:bg-accent/90">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
