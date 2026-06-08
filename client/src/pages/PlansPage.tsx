import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os planos e pacotes de serviços
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Plano" : "Criar Novo Plano"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do plano (Nutri Pró Maxxi)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Nutri Pró Maxxi Trimestral Spitz"
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
                  <Label htmlFor="recurrenceType">Tipo de Recorrência</Label>
                  <Input
                    id="recurrenceType"
                    placeholder="Ex: PIX Santander, Boleto Asaas"
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
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Atualizar" : "Criar"} Plano
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando planos...</div>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Nenhum plano cadastrado</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {packages.map((pkg: Package) => (
            <Card key={pkg.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {pkg.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(pkg)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(pkg.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Banhos</p>
                    <p className="text-lg font-semibold">{pkg.total_baths}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tosas</p>
                    <p className="text-lg font-semibold">{pkg.total_groomings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(pkg.total_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mensalidade</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(pkg.monthly_price)}
                    </p>
                  </div>
                </div>

                {pkg.recurrence_type && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Recorrência</p>
                    <p className="text-sm font-medium">{pkg.recurrence_type}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Status:{" "}
                    <span className="font-medium">
                      {pkg.status === "active"
                        ? "Ativo"
                        : pkg.status === "inactive"
                          ? "Inativo"
                          : "Vencido"}
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este plano? Esta ação não pode ser
              desfeita.
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
