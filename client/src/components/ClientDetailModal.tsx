import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Mail, Phone, MapPin, Calendar, Weight, Heart } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";

interface Pet {
  id: string;
  name: string;
  breed: string;
  sexo: string;
  cor_pelagem: string;
  weight: string;
  is_vip: boolean;
  is_model_dog: boolean;
}

interface Client {
  id: string;
  nome: string;
  email: string;
  phone: string;
  pets: Pet[];
}

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  isLoading?: boolean;
  error?: Error | null;
}

export function ClientDetailModal({
  isOpen,
  onClose,
  client,
  isLoading = false,
  error = null,
}: ClientDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle className="text-2xl font-bold">Detalhes do Cliente</DialogTitle>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Erro ao carregar detalhes</p>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && client && (
          <div className="space-y-6">
            {/* Client Header */}
            <div className="flex items-start gap-4 pb-6 border-b border-accent/10">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-3xl font-bold text-accent flex-shrink-0">
                {client.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-1">{client.nome}</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${client.email}`} className="hover:text-accent transition-colors">
                      {client.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${client.phone}`} className="hover:text-accent transition-colors">
                      {client.phone || "Não informado"}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Pets Section */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-accent" />
                Pets Cadastrados ({client.pets.length})
              </h3>

              {client.pets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum pet cadastrado para este cliente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {client.pets.map((pet) => (
                    <Card
                      key={pet.id}
                      className="p-5 border-l-4 border-l-accent hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-xl font-bold text-accent flex-shrink-0">
                            {pet.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-foreground">{pet.name}</h4>
                            <p className="text-sm text-muted-foreground">{pet.breed}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {pet.is_vip && (
                            <span className="px-3 py-1 bg-accent/10 rounded-full text-xs font-bold text-accent">
                              ⭐ VIP
                            </span>
                          )}
                          {pet.is_model_dog && (
                            <span className="px-3 py-1 bg-purple-100 rounded-full text-xs font-bold text-purple-700">
                              🎯 Modelo
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                            Sexo
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {pet.sexo === "M" ? "Macho" : pet.sexo === "F" ? "Fêmea" : pet.sexo}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                            Cor
                          </p>
                          <p className="text-sm font-semibold text-foreground">{pet.cor_pelagem}</p>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                            Peso
                          </p>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                            <Weight className="w-4 h-4" />
                            {pet.weight} kg
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-accent/10">
              <Button
                onClick={onClose}
                className="flex-1 bg-accent hover:bg-accent/90 text-foreground rounded-lg"
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  // Placeholder for edit functionality
                  console.log("Edit client:", client.id);
                }}
                variant="outline"
                className="flex-1 rounded-lg"
              >
                Editar Cliente
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
