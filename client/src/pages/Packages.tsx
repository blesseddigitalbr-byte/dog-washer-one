import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Ban, Eye, RefreshCw, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewPackageForm } from "@/components/NewPackageForm";
import { toast } from "sonner";

export default function Packages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isNewPackageOpen, setIsNewPackageOpen] = useState(false);

  // Fetch all packages
  const utils = trpc.useUtils();
  const { data: packages = [], isLoading } = trpc.clientPackages.list.useQuery();
  const renewMutation = trpc.clientPackages.renew.useMutation({
    onSuccess: (renewed: any) => {
      toast.success(`Renovação criada: ${renewed.code}`);
      setSelectedPackage(null);
      utils.clientPackages.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const cancelMutation = trpc.clientPackages.cancel.useMutation({
    onSuccess: () => {
      toast.success("Pacote cancelado. O histórico foi preservado.");
      setSelectedPackage(null);
      utils.clientPackages.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  // Calculate consumed services for each package
  const getConsumedServices = (packageId: string) => {
    const pkg: any = packages.find((item: any) => item.id === packageId);

    const consumedBaths = (pkg?.contracted_baths || 0) - (pkg?.balance_baths || 0);

    const consumedGroomings = (pkg?.contracted_groomings || 0) - (pkg?.balance_groomings || 0);

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
    if (pkg.operational_status === "cancelled") return <Badge variant="destructive">Cancelado</Badge>;
    if (pkg.operational_status === "inactive") return <Badge variant="outline">Ciclo encerrado</Badge>;
    if (pkg.operational_status === "expired") return <Badge variant="outline">Vencido</Badge>;
    if (pkg.operational_status === "consumed") return <Badge variant="outline">Sem saldo</Badge>;
    if (pkg.operational_status === "expiring") return <Badge className="bg-amber-500 text-[#07111E]">Vence em breve</Badge>;
    return <Badge className="bg-[#D8B768] text-[#07111E]">Ativo</Badge>;
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
          className="bg-[#113A7A] text-white hover:bg-[#0d2f64]"
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
              {packages.filter((pkg: any) => ["active", "expiring"].includes(pkg.operational_status)).length}
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
                return pkg.operational_status === "expired";
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

      {packages.some((pkg: any) => ["expiring", "expired", "consumed"].includes(pkg.operational_status)) && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[#07111E]">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <p className="font-semibold">Radar de pacotes exige atenção</p>
            <p className="text-sm">
              {packages.filter((pkg: any) => pkg.operational_status === "expiring").length} vencendo em até 7 dias,
              {" "}{packages.filter((pkg: any) => pkg.operational_status === "expired").length} vencidos e
              {" "}{packages.filter((pkg: any) => pkg.operational_status === "consumed").length} sem saldo.
            </p>
          </div>
        </div>
      )}

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
                        <TableCell>{pkg.pet_name}/{pkg.pet_breed || "Raça não informada"} — {pkg.client_name}</TableCell>
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

      <Dialog open={Boolean(selectedPackage)} onOpenChange={(open) => !open && setSelectedPackage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do pacote {selectedPackage?.id_package}</DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-4 md:grid-cols-4">
                <div><p className="text-xs text-muted-foreground">Plano</p><p className="font-semibold">{selectedPackage.plan_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Pet</p><p className="font-semibold">{selectedPackage.pet_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Tutor</p><p className="font-semibold">{selectedPackage.client_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Situação</p>{getStatusBadge(selectedPackage)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Banhos utilizados</p><p className="text-2xl font-bold">{selectedPackage.consumed_baths}/{selectedPackage.total_baths}</p></CardContent></Card>
                <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Saldo de banhos</p><p className="text-2xl font-bold">{selectedPackage.balance_baths}</p></CardContent></Card>
                <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Tosas utilizadas</p><p className="text-2xl font-bold">{selectedPackage.consumed_groomings}/{selectedPackage.total_groomings}</p></CardContent></Card>
                <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Saldo de tosas</p><p className="text-2xl font-bold">{selectedPackage.balance_groomings}</p></CardContent></Card>
              </div>
              <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
                {selectedPackage.status !== "cancelled" && (
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate({ id: selectedPackage.id })}
                  >
                    <Ban className="mr-2 h-4 w-4" /> Cancelar pacote
                  </Button>
                )}
                <Button
                  className="bg-[#D8B768] text-[#07111E] hover:bg-[#c9a652]"
                  disabled={renewMutation.isPending}
                  onClick={() => renewMutation.mutate({ id: selectedPackage.id })}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Renovar em novo ciclo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
