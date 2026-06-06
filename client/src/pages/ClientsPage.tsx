import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const clients = [
    {
      id: 1,
      name: "Helena Silveira",
      email: "helena@email.com",
      phone: "(11) 98765-4321",
      pets: ["Bento", "Maya"],
      totalSpent: "R$ 1.250",
      status: "VIP",
      lastVisit: "12 Mar, 2024",
      avatar: "HS",
    },
    {
      id: 2,
      name: "Ricardo Mendes",
      email: "ricardo@email.com",
      phone: "(11) 99876-5432",
      pets: ["Thor"],
      totalSpent: "R$ 890",
      status: "Regular",
      lastVisit: "05 Mar, 2024",
      avatar: "RM",
    },
    {
      id: 3,
      name: "Ana Beatriz",
      email: "ana@email.com",
      phone: "(11) 97654-3210",
      pets: ["Luna", "Max"],
      totalSpent: "R$ 2.100",
      status: "VIP",
      lastVisit: "18 Mar, 2024",
      avatar: "AB",
    },
    {
      id: 4,
      name: "Lucas Ferreira",
      email: "lucas@email.com",
      phone: "(11) 96543-2109",
      pets: ["Bella"],
      totalSpent: "R$ 450",
      status: "Regular",
      lastVisit: "20 Mar, 2024",
      avatar: "LF",
    },
    {
      id: 5,
      name: "Carla Dias",
      email: "carla@email.com",
      phone: "(11) 95432-1098",
      pets: ["Milo"],
      totalSpent: "R$ 1.680",
      status: "VIP",
      lastVisit: "18 Mar, 2024",
      avatar: "CD",
    },
  ];

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Clientes</h1>
            <p className="text-slate-600">Gerencie seus clientes e pets</p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8 border-0 bg-white">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200"
              />
            </div>
            <Button variant="outline" className="border-slate-200">
              Filtrar
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {["Todos", "VIP", "Regulares", "Inativos"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                tab === "Todos"
                  ? "bg-amber-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="p-6 border-0 bg-white hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                    {client.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{client.name}</h3>
                    <p className="text-sm text-slate-500">{client.email}</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    client.status === "VIP"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {client.status}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-3 mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Pets</p>
                  <div className="flex flex-wrap gap-2">
                    {client.pets.map((pet) => (
                      <span
                        key={pet}
                        className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded"
                      >
                        {pet}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Gasto Total</p>
                  <p className="font-bold text-slate-900">{client.totalSpent}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Última Visita</p>
                  <p className="font-bold text-slate-900">{client.lastVisit}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-200"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensagem
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Add New Button */}
        <div className="mt-8 text-center">
          <Button
            size="lg"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Novo Cliente
          </Button>
        </div>
      </div>
    </div>
  );
}
