import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, MoreVertical, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ClientDetailModal } from "@/components/ClientDetailModal";
import { ClientForm } from "@/components/ClientForm";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ClientsPage() {
  const [filter, setFilter] = useState("todos");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deletingClient, setDeletingClient] = useState<any>(null);

  // Fetch clients from tRPC
  const { data: clients = [], isLoading, error } = trpc.clients.list.useQuery();

  // Fetch selected client details
  const {
    data: selectedClient,
    isLoading: isLoadingDetail,
    error: detailError,
  } = trpc.clients.getById.useQuery(
    { id: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  // Mutations
  const deleteClientMutation = trpc.clients.delete.useMutation();
  const utils = trpc.useUtils();

  // Convert tRPC error to Error object
  const clientDetailError = detailError
    ? new Error(detailError.message || "Erro ao carregar detalhes do cliente")
    : null;

  const filters = [
    { id: "todos", label: "Todos", icon: "📋" },
    { id: "vips", label: "VIPs", icon: "⭐" },
    { id: "modelo", label: "Modelo", icon: "🎯" },
    { id: "recentes", label: "Recentes", icon: "🕐" },
    { id: "inativos", label: "Inativos (30d)", icon: "⏸️" },
  ];

  const filteredClients = clients.filter((client) => {
    if (filter === "vips") return client.pets?.some((pet) => pet.is_vip);
    if (filter === "modelo") return client.pets?.some((pet) => pet.is_model_dog);
    return true;
  });

  // Get first letter of name for avatar
  const getInitial = (name: string) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  // Format date to Brazilian format
  const formatDate = (date: string | null) => {
    if (!date) return "Sem visita";
    try {
      return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Data inválida";
    }
  };

  const handleOpenModal = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleCloseModal = () => {
    setSelectedClientId(null);
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setClientFormOpen(true);
    handleCloseModal();
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;

    try {
      await deleteClientMutation.mutateAsync({ id: deletingClient.id });
      await utils.clients.list.invalidate();
      setDeletingClient(null);
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <Button
            onClick={() => {
              setEditingClient(null);
              setClientFormOpen(true);
            }}
            className="bg-foreground hover:bg-foreground/90 text-background flex items-center gap-2 rounded-full px-6"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 ${
                filter === f.id
                  ? "bg-accent text-foreground"
                  : "bg-white text-foreground hover:bg-accent/5"
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm animate-pulse border-l-4 border-l-accent/20"
              >
                <div className="h-16 bg-accent/10 rounded-full mb-4 w-16" />
                <div className="h-4 bg-accent/10 rounded mb-2" />
                <div className="h-3 bg-accent/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Erro ao carregar clientes</p>
              <p className="text-sm text-red-700">
                {error instanceof Error ? error.message : "Tente novamente mais tarde"}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">Nenhum cliente encontrado</p>
            <Button
              onClick={() => {
                setEditingClient(null);
                setClientFormOpen(true);
              }}
              className="bg-accent hover:bg-accent/90 text-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Cliente
            </Button>
          </div>
        )}

        {/* Clients Grid */}
        {!isLoading && !error && filteredClients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 relative group border-l-4 border-l-accent"
              >
                {/* Menu Button */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2">
                        <MoreVertical className="w-4 h-4 text-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClient(client)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingClient(client)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* VIP Badge */}
                {client.pets?.some((pet) => pet.is_vip) && (
                  <div className="absolute top-4 left-4 bg-accent/10 px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-accent">⭐ VIP</span>
                  </div>
                )}

                {/* Client Info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl flex-shrink-0 font-bold text-accent">
                    {getInitial(client.nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg truncate">{client.nome}</h3>
                    <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                  </div>
                </div>

                {/* Pets */}
                <div className="mb-6">
                  <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                    Pets Cadastrados ({client.pets?.length || 0})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {client.pets && client.pets.length > 0 ? (
                      client.pets.map((pet) => (
                        <div
                          key={pet.id}
                          className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent hover:bg-accent/20 transition-colors"
                          title={`${pet.name} (${pet.breed})`}
                        >
                          {pet.name.charAt(0).toUpperCase()}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Sem pets cadastrados</p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                    Contato
                  </p>
                  <p className="text-sm font-semibold text-foreground mb-3">{client.phone || "Não informado"}</p>
                  <button
                    onClick={() => handleOpenModal(client.id)}
                    className="text-xs text-accent hover:text-accent/80 font-bold transition-colors"
                  >
                    Ver Detalhes →
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Client Card */}
            <div
              onClick={() => {
                setEditingClient(null);
                setClientFormOpen(true);
              }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center cursor-pointer group border-2 border-dashed border-accent/20 hover:border-accent/40"
            >
              <div className="text-center">
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">+</div>
                <p className="text-sm font-bold text-foreground">Adicionar Novo Cliente</p>
                <p className="text-xs text-muted-foreground mt-2">Cadastre um novo perfil e seus pets</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      <ClientDetailModal
        isOpen={!!selectedClientId}
        onClose={handleCloseModal}
        client={selectedClient || null}
        isLoading={isLoadingDetail}
        error={clientDetailError}
        onEditClient={handleEditClient}
      />

      {/* Client Form Modal */}
      <ClientForm
        isOpen={clientFormOpen}
        onClose={() => {
          setClientFormOpen(false);
          setEditingClient(null);
        }}
        clientId={editingClient?.id}
        clientData={editingClient}
        onSuccess={() => {
          utils.clients.list.invalidate();
        }}
      />

      {/* Delete Client Confirmation */}
      <DeleteConfirmationDialog
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleDeleteClient}
        title="Deletar Cliente"
        description="Todos os pets associados também serão deletados. Esta ação não pode ser desfeita."
        itemName={deletingClient?.nome || ""}
        isLoading={deleteClientMutation.isPending}
      />
    </div>
  );
}
