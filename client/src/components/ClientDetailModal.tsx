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
  photo?: string;
  is_vip?: boolean;
  is_model_dog?: boolean;
  status?: string;
  size?: string;
  gender?: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  is_vip?: boolean;
  is_model_client?: boolean;
  pets: Pet[];
}

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onEditClient?: () => void;
}

export function ClientDetailModal({
  isOpen,
  onClose,
  clientId,
  onEditClient,
}: ClientDetailModalProps) {
  const [petFormOpen, setPetFormOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [historyPetId, setHistoryPetId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const deletePetMutation = trpc.pets.delete.useMutation();
  const utils = trpc.useUtils();

  const { data: client, isLoading, error } = trpc.clients.getById.useQuery(
    { id: clientId },
    { enabled: isOpen }
  );

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

          {client && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="flex items-start justify-between pb-4 border-b border-accent/10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent flex-shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-foreground">{client.name}</h3>
                      {client.is_vip && (
                        <span className="px-3 py-1 bg-accent/10 rounded-full text-xs font-bold text-accent">
                          ⭐ VIP
                        </span>
                      )}
                      {client.is_model_client && (
                        <span className="px-3 py-1 bg-purple-100 rounded-full text-xs font-bold text-purple-700">
                          🎯 Modelo
                        </span>
                      )}
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="w-4 h-4" />
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={onEditClient}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </Button>
              </div>

              {/* Pets Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    ❤️ Pets Cadastrados ({client.pets.length})
                  </h4>
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
                    <p>Nenhum pet cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {client.pets.map((pet: Pet) => (
                      <Card key={pet.id} className="border-l-4 border-l-accent p-4">
                        {/* Pet Header with Photo and Basic Info */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            {pet.photo ? (
                              <img
                                src={pet.photo}
                                alt={pet.name}
                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent flex-shrink-0">
                                {pet.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-bold text-foreground">{pet.name}</h4>
                                {(pet as any).gender && (
                                  <span className="text-lg">
                                    {(pet as any).gender === 'M' ? '♂️' : '♀️'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{pet.breed}</p>
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
                          </div>
                        </div>

                        {/* Pet Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-accent/5 rounded-lg">
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                              🐕 Raça
                            </p>
                            <p className="text-sm font-medium text-foreground">{pet.breed}</p>
                          </div>
                          {(pet as any).size && (
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                                📏 Porte
                              </p>
                              <p className="text-sm font-medium text-foreground">{(pet as any).size}</p>
                            </div>
                          )}
                          {pet.birthDate && (
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                                📅 Nascimento
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                {new Date(pet.birthDate).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          )}
                          {pet.color && (
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                                🎨 Cor
                              </p>
                              <p className="text-sm font-medium text-foreground">{pet.color}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
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
                            Excluir
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
          petName={client.pets.find((p: Pet) => p.id === historyPetId)?.name || "Pet"}
          visits={[]}
        />
      )}
    </>
  );
}
