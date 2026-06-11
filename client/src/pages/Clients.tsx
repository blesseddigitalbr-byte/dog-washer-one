import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, MoreVertical, AlertCircle, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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

const ITEMS_PER_PAGE = 12;

export default function ClientsPage() {
  const [filter, setFilter] = useState("todos");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deletingClient, setDeletingClient] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientForNewPet, setClientForNewPet] = useState<any>(null);

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
    { id: "todos", label: "Todos", icon: "∞" },
    { id: "vips", label: "VIPs", icon: "★" },
    { id: "modelo", label: "Modelo", icon: "✓" },
    { id: "recentes", label: "Recentes", icon: "⏳" },
    { id: "inativos", label: "Inativos (30d)", icon: "⚠" },
  ];

  const filteredClients = clients.filter((client: any) => {
    if (filter === "vips") return client.is_vip || client.pets?.some((pet: any) => pet.is_vip);
    if (filter === "modelo") return client.is_model_dog || client.pets?.some((pet: any) => pet.is_model_dog);
    return true;
  });

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

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

  const handleAddNewPet = (client: any) => {
    setClientForNewPet(client);
    handleOpenModal(client.id);
  };

  return (
    <div className="flex-1 overflow-auto bg-background">
      {/* Main Container - Centralizado com largura máxima 1280px */}
      <div className="max-w-[1280px] mx-auto px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Clientes</h1>
              <p className="text-sm text-muted-foreground mt-2">Gerencie tutores, pets, histórico e relacionamento.</p>
            </div>
            <Button
              onClick={() => {
                setEditingClient(null);
                setClientFormOpen(true);
              }}
              className="bg-foreground hover:bg-foreground/90 text-background flex items-center gap-2 rounded-full px-6 h-11 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Novo Cliente
            </Button>
          </div>

          {/* Filters - Pill Format */}
          <div className="flex gap-3 flex-wrap mt-6">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => handleFilterChange(f.id)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 border ${
                  filter === f.id
                    ? "bg-accent text-foreground border-accent shadow-sm"
                    : "bg-white text-foreground border-border hover:border-accent/30 hover:shadow-sm"
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                  filter === f.id
                    ? "bg-foreground/20 text-foreground"
                    : "bg-accent/10 text-accent"
                }`}>
                  {f.icon}
                </span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[16px] p-5 shadow-sm border border-border animate-pulse"
              >
                <div className="h-12 bg-accent/10 rounded-full mb-4 w-12" />
                <div className="h-4 bg-accent/10 rounded mb-2" />
                <div className="h-3 bg-accent/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-[16px] p-5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
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
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-6">Nenhum cliente encontrado</p>
            <Button
              onClick={() => {
                setEditingClient(null);
                setClientFormOpen(true);
              }}
              className="bg-accent hover:bg-accent/90 text-foreground rounded-full px-6 h-11 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Cliente
            </Button>
          </div>
        )}

        {/* Clients Grid - 4 colunas em XL, 3 em LG, 2 em MD, 1 em SM */}
        {!isLoading && !error && filteredClients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg p-5 shadow-sm border border-border hover:shadow-md transition-all duration-200 relative group border-l-4 border-l-chart-3 flex flex-col"
              >
                {/* Menu Button */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                        <MoreVertical className="w-4 h-4 text-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAddNewPet(client)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Pet
                      </DropdownMenuItem>
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

                {/* Client Header - Avatar + Name + Email + Phone */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-lg font-bold text-accent flex-shrink-0">
                    {getInitial(client.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm truncate">{client.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                      📱 {client.phone || "Não informado"}
                    </p>
                  </div>
                </div>

                {/* Badges - VIP / Modelo */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {client.pets?.some((pet: any) => pet.is_vip) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full text-xs font-semibold text-accent">
                      ⭐ VIP
                    </span>
                  )}
                  {client.pets?.some((pet: any) => pet.is_model_dog) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full text-xs font-semibold text-purple-700">
                      🎯 Modelo
                    </span>
                  )}
                </div>

                {/* Pets */}
                <div className="mb-4 pb-4 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Pets Cadastrados
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {client.pets && client.pets.length > 0 ? (
                      client.pets.map((pet: any) => (
                        <div
                          key={pet.id}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-full hover:bg-accent/20 transition-colors cursor-pointer"
                          title={`${pet.name} (${pet.breed})`}
                        >
                          {pet.photo ? (
                            <img
                              src={pet.photo}
                              alt={pet.name}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                              {pet.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="flex flex-col leading-tight">
                            <span className="text-xs font-semibold text-accent truncate">{pet.name}</span>
                            {pet.breed && <span className="text-xs text-accent/70 truncate">{pet.breed}</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Sem pets cadastrados</p>
                    )}
                  </div>
                </div>

                {/* Última Visita */}
                <div className="mb-4 pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Última Visita</p>
                      <p className="text-sm font-semibold text-foreground mt-1">-</p>
                    </div>
                    <button
                      onClick={() => handleOpenModal(client.id)}
                      className="text-xs text-accent hover:text-accent/80 font-bold transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      Ver Detalhes →
                    </button>
                  </div>
                </div>


              </div>
            ))}

            {/* Add New Client Card */}
            <div
              onClick={() => {
                setEditingClient(null);
                setClientFormOpen(true);
              }}
              className="bg-white rounded-[16px] p-5 shadow-sm border-2 border-dashed border-accent/20 hover:border-accent/40 hover:shadow-md transition-all duration-200 flex items-center justify-center cursor-pointer group min-h-[280px]"
            >
              <div className="text-center">
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">+</div>
                <p className="text-sm font-bold text-foreground">Adicionar Novo Cliente</p>
                <p className="text-xs text-muted-foreground mt-2">Cadastre um novo perfil e seus pets</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        {!isLoading && !error && filteredClients.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>👥 {filteredClients.length} clientes encontrados</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Itens por página: <span className="font-semibold">{ITEMS_PER_PAGE}</span></span>
              <span className="text-sm text-muted-foreground">{startIndex + 1}-{Math.min(endIndex, filteredClients.length)} de {filteredClients.length}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md hover:bg-accent/20 text-foreground hover:text-accent transition-all duration-200 flex items-center gap-1.5 text-sm font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md hover:bg-accent/20 text-foreground hover:text-accent transition-all duration-200 flex items-center gap-1.5 text-sm font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Próxima página"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      <ClientDetailModal
        isOpen={!!selectedClientId}
        onClose={handleCloseModal}
        clientId={selectedClientId || ""}
        onEditClient={() => handleEditClient(selectedClient)}
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
        itemName={deletingClient?.name || deletingClient?.nome || ""}
        isLoading={deleteClientMutation.isPending}
      />
    </div>
  );
}
