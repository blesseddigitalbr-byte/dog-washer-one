import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewPackageForm } from "@/components/NewPackageForm";

export default function Packages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isNewPackageOpen, setIsNewPackageOpen] = useState(false);

  // Fetch all packages
  const { data: packages = [], isLoading } = trpc.packages.list.useQuery();

  // Fetch all appointments to calculate consumed services
  const { data: appointments = [] } = trpc.appointments.list.useQuery();

  // Calculate consumed services for each package
  const getConsumedServices = (packageId: string) => {
    const finalized = appointments.filter(
      (apt: any) => apt.package_id === packageId && apt.status === "Finalizado/Check"
    );

    const consumedBaths = finalized.filter((apt: any) =>
      ["Banho", "Combo Higiene"].includes(apt.service_name)
    ).length;

    const consumedGroomings = finalized.filter((apt: any) =>
      ["Tosa", "Trimming", "Higienização"].includes(apt.service_name)
    ).length;

    return { consumedBaths, consumedGroomings };
  };

  // Filter packages by search term
  const filteredPackages = packages.filter((pkg: any) =>
    pkg.pet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.id_package?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine status badge color
  const getStatusBadge = (pkg: any) => {
    const today = new Date();
    const expiryDate = new Date(pkg.expiry_date);

    if (pkg.status === "Cancelado") return <Badge variant="destructive">Cancelado</Badge>;
    if (expiryDate < today) return <Badge variant="outline">Vencido</Badge>;
    if (pkg.balance_baths <= 0 && pkg.balance_groomings <= 0) return <Badge variant="outline">Sem Saldo</Badge>;
    return <Badge className="bg-secondary text-secondary-foreground">Ativo</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando pacotes...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacotes Contratados</h1>
          <p className="text-muted-foreground mt-2">Gerencie os pacotes e saldos dos clientes</p>
        </div>
        <Button 
          className="bg-secondary hover:bg-secondary/90"
          onClick={() => setIsNewPackageOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Pacote
        </Button>
      </div>

      {/* KPI Cards - Moved to Top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pacotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pacotes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.filter((pkg: any) => pkg.status === "Ativo").length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pacotes Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.filter((pkg: any) => {
                const today = new Date();
                const expiryDate = new Date(pkg.expiry_date);
                return expiryDate < today;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {packages.reduce((sum: number, pkg: any) => sum + (pkg.value || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por pet, cliente ou ID do pacote..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Table */}
      <Card className="border-l-4 border-l-chart-3">
        <CardHeader>
          <CardTitle>Relação de Pacotes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">ID Pacote</TableHead>
                  <TableHead className="font-bold">Pet e Tutor</TableHead>
                  <TableHead className="font-bold">ID Pet</TableHead>
                  <TableHead className="font-bold">ID Cliente</TableHead>
                  <TableHead className="font-bold">Data Contratação</TableHead>
                  <TableHead className="font-bold">Data Pagamento</TableHead>
                  <TableHead className="font-bold">Valor</TableHead>
                  <TableHead className="font-bold">Plano</TableHead>
                  <TableHead className="font-bold">Frequência</TableHead>
                  <TableHead className="font-bold">Banhos Contratados</TableHead>
                  <TableHead className="font-bold">Tosas Contratadas</TableHead>
                  <TableHead className="font-bold">Banhos Realizados</TableHead>
                  <TableHead className="font-bold">Tosas Realizadas</TableHead>
                  <TableHead className="font-bold">Saldo Banhos</TableHead>
                  <TableHead className="font-bold">Saldo Tosas</TableHead>
                  <TableHead className="font-bold">Vencimento</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-8 text-muted-foreground">
                      Nenhum pacote encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPackages.map((pkg: any) => {
                    const consumed = getConsumedServices(pkg.id);
                    const balanceBaths = (pkg.total_baths || 0) - consumed.consumedBaths;
                    const balanceGroomings = (pkg.total_groomings || 0) - consumed.consumedGroomings;

                    return (
                      <TableRow key={pkg.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm font-bold text-secondary">{pkg.id_package}</TableCell>
                        <TableCell>{pkg.pet_name} ({pkg.client_name})</TableCell>
                        <TableCell className="font-mono text-sm">{pkg.id_pet}</TableCell>
                        <TableCell className="font-mono text-sm">{pkg.id_client}</TableCell>
                        <TableCell>{new Date(pkg.contract_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{pkg.payment_date ? new Date(pkg.payment_date).toLocaleDateString("pt-BR") : "-"}</TableCell>
                        <TableCell>R$ {pkg.value?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell className="max-w-xs truncate">{pkg.plan_name}</TableCell>
                        <TableCell>{pkg.frequency}</TableCell>
                        <TableCell className="text-center">{pkg.total_baths || 0}</TableCell>
                        <TableCell className="text-center">{pkg.total_groomings || 0}</TableCell>
                        <TableCell className="text-center">{consumed.consumedBaths}</TableCell>
                        <TableCell className="text-center">{consumed.consumedGroomings}</TableCell>
                        <TableCell className="text-center font-bold">{balanceBaths}</TableCell>
                        <TableCell className="text-center font-bold">{balanceGroomings}</TableCell>
                        <TableCell>{new Date(pkg.expiry_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{getStatusBadge(pkg)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedPackage(pkg)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Package Dialog */}
      <Dialog open={isNewPackageOpen} onOpenChange={setIsNewPackageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Pacote</DialogTitle>
          </DialogHeader>
          <NewPackageForm onClose={() => setIsNewPackageOpen(false)} />
          <Button 
              variant="outline" 
              onClick={() => setIsNewPackageOpen(false)}
              className="w-full mt-4"
            >
              Fechar
            </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
