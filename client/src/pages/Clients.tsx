import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, MoreVertical } from "lucide-react";

export default function ClientsPage() {
  const [filter, setFilter] = useState("todos");

  // Dados de exemplo
  const clients = [
    {
      id: 1,
      name: "Helena Silveira",
      email: "helena@example.com",
      avatar: "👩",
      pets: ["Bento", "Max"],
      lastVisit: "12 Mai, 2024",
      type: "regular",
    },
    {
      id: 2,
      name: "Ricardo Mendes",
      email: "ricardo@example.com",
      avatar: "👨",
      pets: ["Thor"],
      lastVisit: "09 Mai, 2024",
      type: "vip",
    },
    {
      id: 3,
      name: "Ana Beatriz",
      email: "ana@example.com",
      avatar: "👩",
      pets: ["Luna"],
      lastVisit: "28 Abr, 2024",
      type: "regular",
    },
    {
      id: 4,
      name: "Lucas Ferreira",
      email: "lucas@example.com",
      avatar: "👨",
      pets: ["Toby"],
      lastVisit: "20 Abr, 2024",
      type: "regular",
    },
    {
      id: 5,
      name: "Carla Dias",
      email: "carla@example.com",
      avatar: "👩",
      pets: ["Bella"],
      lastVisit: "15 Abr, 2024",
      type: "vip",
    },
  ];

  const filters = [
    { id: "todos", label: "Todos", icon: "📋" },
    { id: "vips", label: "VIPs", icon: "⭐" },
    { id: "modelo", label: "Modelo", icon: "🎯" },
    { id: "recentes", label: "Recentes", icon: "🕐" },
    { id: "inativos", label: "Inativos (30d)", icon: "⏸️" },
  ];

  const filteredClients = clients.filter((client) => {
    if (filter === "vips") return client.type === "vip";
    return true;
  });

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <Button className="bg-foreground hover:bg-foreground/90 text-background flex items-center gap-2 rounded-full px-6">
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

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 relative group border-l-4 border-l-accent"
            >
              {/* Menu Button */}
              <button className="absolute top-4 right-4 p-2 hover:bg-accent/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4 text-foreground" />
              </button>

              {/* VIP Badge */}
              {client.type === "vip" && (
                <div className="absolute top-4 left-4 bg-accent/10 px-3 py-1 rounded-full">
                  <span className="text-xs font-bold text-accent">⭐ VIP</span>
                </div>
              )}

              {/* Client Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {client.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-lg truncate">{client.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                </div>
              </div>

              {/* Pets */}
              <div className="mb-6">
                <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Pets Cadastrados</p>
                <div className="flex gap-2 flex-wrap">
                  {client.pets.map((pet, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent hover:bg-accent/20 transition-colors"
                      title={pet}
                    >
                      {pet.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Visit */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Última Visita</p>
                <p className="text-sm font-semibold text-foreground mb-3">{client.lastVisit}</p>
                <button className="text-xs text-accent hover:text-accent/80 font-bold transition-colors">
                  Ver Histórico →
                </button>
              </div>
            </div>
          ))}

          {/* Add New Client Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center cursor-pointer group border-2 border-dashed border-accent/20 hover:border-accent/40">
            <div className="text-center">
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">+</div>
              <p className="text-sm font-bold text-foreground">Adicionar Novo Cliente</p>
              <p className="text-xs text-muted-foreground mt-2">Cadastre um novo perfil e seus pets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
