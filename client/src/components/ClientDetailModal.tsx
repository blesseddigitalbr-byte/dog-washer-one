import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Mail, Phone, MapPin, Calendar, Weight, Heart, Edit2, Trash2, Plus, User, MapPinIcon, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PetForm } from "./PetForm";
import { PetHistoryModal } from "./PetHistoryModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { trpc } from "@/lib/trpc";

interface Pet {
  id: string;
  name: string;
  breed: string;
  species?: string;
  color?: string;
  weight?: number;
  birthDate?: string;
  microchip?: string;
  notes?: string;
  photo?: string;
  status?: string;
  is_vip?: boolean;
  is_model_dog?: boolean;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isVip?: boolean;
  status?: string;
  totalSpent?: number;
  lastVisit?: string;
  pets: Pet[];
}

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  isLoading?: boolean;
  error?: Error | null;
  onEditClient?: (client: Client) => void;
}

export function ClientDetailModal({
  isOpen,
  onClose,
  client,
  isLoading = false,
  error = null,
  onEditClient,
}: ClientDetailModalProps) {
  const [petFormOpen, setPetFormOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [historyPetId, setHistoryPetId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const deletePetMutation = trpc.pets.delete.useMutation();
  const utils = trpc.useUtils();

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setPetFormOpen(true);
  };

  const handleDeletePet = async () => {
    if (!deletingPet) return;

    try {
      const petName = deletingPet.name;
      await deletePetMutation.mutateAsync({ id: deletingPet.id });
      await utils.clients.getById.invalidate({ id: client?.id });
      toast.success("Pet deletado com sucesso!", {
        description: `${petName} foi removido do sistema.`,
      });
      setDeletingPet(null);
    } catch (error) {
      console.error("Error deleting pet:", error);
      toast.error("Erro ao deletar pet", {
        description: "Tente novamente mais tarde.",
      });
    }
  };

  const handleClosePetForm = () => {
    setPetFormOpen(false);
    setEditingPet(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  {(client.name || (client as any).nome)?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-2xl font-bold text-foreground">{client.name || (client as any).nome}</h2>
                    {(client.isVip || (client as any).is_vip) && (
                      <span className="px-2 py-1 bg-accent/10 rounded-full text-xs font-bold text-accent">
                        ⭐ VIP
                      </span>
                    )}
                    {((client as any).is_model_dog) && (
                      <span className="px-2 py-1 bg-purple-100 rounded-full text-xs font-bold text-purple-700">
                        🎯 Modelo
                      </span>
                    )}
                  </div>
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
                <Button
                  onClick={() => onEditClient?.(client)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </Button>
              </div>

              {/* Client Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {client.status && (
                  <div className="bg-accent/5 p-3 rounded-lg">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                    <p className="text-sm font-medium text-foreground capitalize">{client.status}</p>
                  </div>
                )}
                {client.address && (
                  <div className="bg-accent/5 p-3 rounded-lg col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Endereço</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">{client.address}</p>
                    {(client.city || client.state || client.zipCode) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {[client.city, client.state, client.zipCode].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                )}
                {client.totalSpent !== undefined && (
                  <div className="bg-accent/5 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Gasto</p>
                    <p className="text-sm font-medium text-foreground">
                      R$ {typeof client.totalSpent === 'number' ? client.totalSpent.toFixed(2) : '0.00'}
                    </p>
                  </div>
                )}
                {client.lastVisit && (
                  <div className="bg-accent/5 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Última Visita</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              {/* Pets Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Heart className="w-5 h-5 text-accent" />
                    Pets Cadastrados ({client.pets.length})
                  </h3>
                  <Button
                    onClick={() => {
                      setEditingPet(null);
                      setPetFormOpen(true);
                    }}
                    size="sm"
                    className="gap-2 bg-accent hover:bg-accent/90"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Pet
                  </Button>
                </div>

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
                            {pet.photo ? (
                              <img
                                src={pet.photo}
                                alt={pet.name}
                                className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-xl font-bold text-accent flex-shrink-0">
                                {pet.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h4 className="text-lg font-bold text-foreground">{pet.name}</h4>
                              <p className="text-sm text-muted-foreground">{pet.breed}</p>
                              {(pet as any).size && (
                                <p className="text-xs text-muted-foreground">Porte: {(pet as any).size}</p>
                              )}
                              {pet.birthDate && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(pet.birthDate).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
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
                            {pet.status && (
                              <span className="px-3 py-1 bg-blue-100 rounded-full text-xs font-bold text-blue-700 capitalize">
                                {pet.status}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                              Raça
                            </p>
                            <p className="text-sm font-medium text-foreground">{pet.breed}</p>
                          </div>
                          {pet.color && (
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                                Cor
                              </p>
                              <p className="text-sm font-medium text-foreground">{pet.color}</p>
                            </div>
                          )}
                          {pet.birthDate && (
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                                Nascimento
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                {new Date(pet.birthDate).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          )}
                        </div>



                        <div className="flex gap-2 justify-end flex-wrap">
                          <Button
                            onClick={() => {
                              setHistoryPetId(pet.id);
                              setHistoryOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Ver Histórico
                          </Button>
                          <Button
                            onClick={() => handleEditPet(pet)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Detalhes
                          </Button>
                          <Button
                            onClick={() => setDeletingPet(pet)}
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                            Deletar
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end gap-2 pt-4 border-t border-accent/10">
                <Button onClick={onClose} variant="outline">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pet Form Modal */}
      {petFormOpen && client && (
        <PetForm
          isOpen={petFormOpen}
          onClose={handleClosePetForm}
          petData={editingPet}
          clientId={client.id}
          petId={editingPet?.id}
          onSuccess={() => {
            handleClosePetForm();
            utils.clients.getById.invalidate({ id: client.id });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingPet && (
        <DeleteConfirmationDialog
          isOpen={!!deletingPet}
          title="Deletar Pet"
          description="Tem certeza que deseja deletar esse pet?"
          itemName={deletingPet.name}
          onConfirm={handleDeletePet}
          onClose={() => setDeletingPet(null)}
          isLoading={deletePetMutation.isPending}
        />
      )}

      {/* Pet History Modal */}
      {historyOpen && historyPetId && client && (
        <PetHistoryModal
          isOpen={historyOpen}
          onClose={() => {
            setHistoryOpen(false);
            setHistoryPetId(null);
          }}
          petName={client.pets.find(p => p.id === historyPetId)?.name || "Pet"}
          visits={[]}
        />
      )}
    </>
  );
}
