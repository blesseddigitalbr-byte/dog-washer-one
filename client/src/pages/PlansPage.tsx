import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Package {
  id: string;
  name: string;
  description?: string;
  total_baths: number;
  total_groomings: number;
  total_price: number;
  monthly_price: number;
  recurrence_type?: string;
  status: string;
  created_at?: string;
}

export function PlansPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalBaths: 0,
    totalGroomings: 0,
    totalPrice: 0,
    monthlyPrice: 0,
    recurrenceType: "",
    status: "active",
  });

  const utils = trpc.useUtils();
  const { data: packages = [], isLoading } = trpc.packages.list.useQuery();
  const createMutation = trpc.packages.create.useMutation();
  const updateMutation = trpc.packages.update.useMutation();
  const deleteMutation = trpc.packages.delete.useMutation();

  const handleOpenDialog = (pkg?: Package) => {
    if (pkg) {
      setEditingId(pkg.id);
      setFormData({
        name: pkg.name,
        description: pkg.description || "",
        totalBaths: pkg.total_baths,
        totalGroomings: pkg.total_groomings,
        totalPrice: pkg.total_price,
        monthlyPrice: pkg.monthly_price,
        recurrenceType: pkg.recurrence_type || "",
        status: pkg.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        totalBaths: 0,
        totalGroomings: 0,
        totalPrice: 0,
        monthlyPrice: 0,
        recurrenceType: "",
        status: "active",
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error("Nome do plano é obrigatório");
        return;
      }

      if (formData.totalPrice <= 0) {
        toast.error("Valor total deve ser maior que 0");
        return;
      }

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("Plano atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Plano criado com sucesso!");
      }

      utils.packages.list.invalidate();
      setOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar plano");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Plano deletado com sucesso!");
      utils.packages.list.invalidate();
      setDeleteId(null);
    } catch (error) {
      toast.error("Erro ao deletar plano");
      console.error(error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "expired":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "inactive":
        return "Inativo";
      case "expired":
        return "Vencido";
      default:
        return status;
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Planos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os planos e pacotes de serviços
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              + Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Plano" : "Criar Novo Plano"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do plano
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Tipo Cão Modelo Mensal"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição do plano..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalBaths">Qtd de Banhos</Label>
                  <Input
                    id="totalBaths"
                    type="number"
                    min="0"
                    value={formData.totalBaths}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalBaths: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="totalGroomings">Qtd de Tosas</Label>
                  <Input
                    id="totalGroomings"
                    type="number"
                    min="0"
                    value={formData.totalGroomings}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalGroomings: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalPrice">Valor Total (R$) *</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyPrice">Valor Mensal (R$)</Label>
                  <Input
                    id="monthlyPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monthlyPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrenceType">Recorrência</Label>
                  <Input
                    id="recurrenceType"
                    placeholder="Ex: Sim/Não"
                    value={formData.recurrenceType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrenceType: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="expired">Vencido</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                {editingId ? "Atualizar" : "Criar"} Plano
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-chart-3 rounded-lg shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total de Planos</p>
                <p className="text-2xl font-bold text-foreground mt-1">{packages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 rounded-lg shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Planos Ativos</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {packages.filter((p: Package) => p.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 rounded-lg shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Planos Inativos</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {packages.filter((p: Package) => p.status !== "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando planos...</div>
      ) : packages.length === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground mb-6">Nenhum plano cadastrado</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Column Headers - FORA DOS CARDS */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">
            <div className="col-span-2">IDENTIFICAÇÃO DO PLANO</div>
            <div className="col-span-1 text-center">BANHOS</div>
            <div className="col-span-1 text-center">TOSAS</div>
            <div className="col-span-2 text-center">INVESTIMENTO</div>
            <div className="col-span-2 text-center">FATURAMENTO</div>
            <div className="col-span-2 text-center">AÇÕES</div>
            <div className="col-span-2"></div>
          </div>

          {/* Plan Rows */}
          {packages.map((pkg: Package) => (
            <div
              key={pkg.id}
              className="border-l-4 border-l-chart-3 bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Plan Name and Description */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground">{pkg.name}</h3>
                    <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded whitespace-nowrap">PAC-{String(packages.findIndex((p: Package) => p.id === pkg.id) + 1).padStart(4, '0')}</span>
                  </div>
                  {pkg.description && (
                    <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                  )}
                </div>

                {/* Banhos */}
                <div className="col-span-1 text-center">
                  <p className="font-medium text-foreground">{pkg.total_baths}</p>
                </div>

                {/* Tosas */}
                <div className="col-span-1 text-center">
                  <p className="font-medium text-foreground">{pkg.total_groomings}</p>
                </div>

                {/* Investimento (Valor Total) */}
                <div className="col-span-2 text-center">
                  <p className="font-medium text-foreground">
                    {formatCurrency(pkg.total_price)}
                  </p>
                </div>

                {/* Faturamento (Mensalidade) */}
                <div className="col-span-2 text-center">
                  <p className="text-sm text-muted-foreground">Mensalidade: {formatCurrency(pkg.monthly_price)}</p>
                  <p className="text-xs text-muted-foreground">{pkg.recurrence_type || "-"}</p>
                </div>

                {/* Status Badge */}
                <div className="col-span-2 flex justify-center">
                  <Badge className={`${getStatusColor(pkg.status)} text-xs font-medium border`}>
                    {getStatusLabel(pkg.status)}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(pkg)}
                    className="border-border text-foreground hover:bg-muted"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(pkg.id)}
                    className="border-border text-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este plano? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
