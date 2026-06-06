import { Users, Phone, Mail, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ClientsPage() {
  // Dados de exemplo
  const clients = [
    {
      id: 1,
      name: "João Silva",
      email: "joao@example.com",
      phone: "(11) 98765-4321",
      city: "São Paulo",
      pets: 2,
      totalSpent: "R$ 450,00",
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "(11) 99876-5432",
      city: "São Paulo",
      pets: 1,
      totalSpent: "R$ 280,00",
    },
    {
      id: 3,
      name: "Carlos Oliveira",
      email: "carlos@example.com",
      phone: "(11) 97654-3210",
      city: "Guarulhos",
      pets: 3,
      totalSpent: "R$ 890,00",
    },
    {
      id: 4,
      name: "Ana Costa",
      email: "ana@example.com",
      phone: "(11) 96543-2109",
      city: "São Paulo",
      pets: 1,
      totalSpent: "R$ 150,00",
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gerencie todos os seus clientes e seus pets</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            + Novo Cliente
          </Button>
          <Button variant="outline">Filtrar</Button>
          <Button variant="outline">Exportar</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 border-accent/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold text-foreground">{clients.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-accent/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Phone className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold text-foreground">{clients.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-accent/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cidades</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Clients Table */}
        <Card className="border-accent/30 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 border-b border-border">
                  <TableHead className="text-foreground font-semibold">Nome</TableHead>
                  <TableHead className="text-foreground font-semibold">Email</TableHead>
                  <TableHead className="text-foreground font-semibold">Telefone</TableHead>
                  <TableHead className="text-foreground font-semibold">Cidade</TableHead>
                  <TableHead className="text-foreground font-semibold">Pets</TableHead>
                  <TableHead className="text-foreground font-semibold">Total Gasto</TableHead>
                  <TableHead className="text-foreground font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                    <TableCell className="text-muted-foreground">{client.email}</TableCell>
                    <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{client.city}</TableCell>
                    <TableCell className="text-foreground font-medium">{client.pets}</TableCell>
                    <TableCell className="text-foreground font-medium">{client.totalSpent}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          Ver
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
