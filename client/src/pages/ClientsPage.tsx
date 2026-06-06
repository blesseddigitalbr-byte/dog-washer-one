import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");

  const clients = [
    {
      id: 1,
      name: "Helena Silveira",
      email: "helena@email.com",
      pets: ["Bento", "Maya"],
      lastVisit: "12 Mai, 2024",
      status: "VIP",
      avatar: "HS",
    },
    {
      id: 2,
      name: "Ricardo Mendes",
      email: "ricardo@email.com",
      pets: ["Thor"],
      lastVisit: "05 Mai, 2024",
      status: "Modelo",
      avatar: "RM",
    },
    {
      id: 3,
      name: "Ana Beatriz",
      email: "ana@email.com",
      pets: ["Luna"],
      lastVisit: "28 Abr, 2024",
      status: "VIP",
      avatar: "AB",
    },
    {
      id: 4,
      name: "Lucas Ferreira",
      email: "lucas@email.com",
      pets: ["Toby"],
      lastVisit: "20 Abr, 2024",
      status: "Regular",
      avatar: "LF",
    },
    {
      id: 5,
      name: "Carla Dias",
      email: "carla@email.com",
      pets: ["Snow"],
      lastVisit: "15 Abr, 2024",
      status: "VIP",
      avatar: "CD",
    },
  ];

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === "todos") return matchesSearch;
    if (selectedFilter === "vips") return matchesSearch && client.status === "VIP";
    if (selectedFilter === "modelo") return matchesSearch && client.status === "Modelo";
    if (selectedFilter === "regulares") return matchesSearch && client.status === "Regular";
    if (selectedFilter === "inativos") return matchesSearch && client.status === "Inativo";
    
    return matchesSearch;
  });

  const filters = [
    { id: "todos", label: "Todos", count: clients.length },
    { id: "vips", label: "VIPs", count: clients.filter(c => c.status === "VIP").length },
    { id: "modelo", label: "Modelo", count: clients.filter(c => c.status === "Modelo").length },
    { id: "regulares", label: "Regulares", count: clients.filter(c => c.status === "Regular").length },
    { id: "inativos", label: "Inativos (304)", count: 304 },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <Button className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                selectedFilter === filter.id
                  ? "bg-white border-l-4 border-l-secondary text-foreground shadow-sm"
                  : "bg-white border border-border text-foreground hover:border-secondary"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border bg-white"
            />
          </div>
          <div className="text-right mt-2 text-sm text-muted-foreground">
            Total: {filteredClients.length} Clientes
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-all hover:border-secondary"
            >
              {/* Header with Avatar and Menu */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-secondary">{client.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Pets */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">PETS CADASTRADOS</p>
                <div className="flex gap-2">
                  {client.pets.map((pet, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary"
                    >
                      {pet.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Visit */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">ÚLTIMA VISITA</p>
                  <p className="text-sm font-medium text-foreground">{client.lastVisit}</p>
                </div>
                <button className="text-secondary hover:text-secondary/80 flex items-center gap-1 text-sm font-medium">
                  Ver Histórico
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add New Client Card */}
          <div className="bg-white rounded-lg p-6 border-2 border-dashed border-border hover:border-secondary transition-all flex flex-col items-center justify-center min-h-64">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-secondary" />
            </div>
            <p className="font-semibold text-foreground mb-1">Adicionar Novo Cliente</p>
            <p className="text-sm text-muted-foreground text-center">
              Cadastre um novo perfil e seu respectivo pet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
