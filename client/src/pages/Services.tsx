import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader, Clock, DollarSign } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function Services() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationMinutes: "60",
  });

  // Queries
  const { data: services = [], isLoading, refetch } = trpc.services.list.useQuery();

  // Mutations
  const createMutation = trpc.services.create.useMutation();
  const updateMutation = trpc.services.update.useMutation();
  const deleteMutation = trpc.services.delete.useMutation();

  const handleOpenDialog = (service?: any) => {
    if (service) {
      setEditingId(service.id);
      setFormData({
        name: service.name,
        description: service.description || "",
        price: service.price?.toString() || "",
        durationMinutes: (service.durationMinutes ?? service.duration_minutes ?? 60).toString(),
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        durationMinutes: "60",
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome do serviço é obrigatório");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Preço deve ser maior que 0");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        durationMinutes: parseInt(formData.durationMinutes),
      };

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...payload,
        });
        toast.success("Serviço atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Serviço criado com sucesso!");
      }

      setIsOpen(false);
      await refetch();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      toast.error("Erro ao salvar serviço");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Serviço deletado com sucesso!");
      await refetch();
      setDeleteId(null);
    } catch (error) {
      console.error("Erro ao deletar serviço:", error);
      toast.error("Erro ao deletar serviço");
    }
  };

  const filteredServices = services.filter((service: any) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Serviços & Cursos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os serviços e cursos oferecidos
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              + Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Serviço" : "Novo Serviço"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Tosa Completa"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição do serviço"
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMinutes: e.target.value,
                      })
                    }
                    placeholder="60"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {editingId ? "Atualizar" : "Criar"} Serviço
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-chart-3 rounded-lg shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Serviços Ativos</p>
                <p className="text-2xl font-bold text-foreground mt-1">{services.length}</p>
              </div>
              <div className="text-secondary opacity-20">
                <DollarSign size={32} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 rounded-lg shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Preço Médio</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {services.length > 0
                    ? formatCurrency(
                        services.reduce((sum: number, s: any) => sum + (s.price || 0), 0) /
                          services.length
                      )
                    : "R$ 0,00"}
                </p>
              </div>
              <div className="text-secondary opacity-20">
                <DollarSign size={32} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 rounded-lg shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Duração Média</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {services.length > 0
                    ? Math.round(
                        services.reduce(
                          (sum: number, s: any) =>
                            sum + Number(s.durationMinutes ?? s.duration_minutes ?? 0),
                          0,
                        ) /
                          services.length
                      )
                    : 0}{" "}
                  min
                </p>
              </div>
              <div className="text-secondary opacity-20">
                <Clock size={32} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar serviço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Services List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredServices.length === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground mb-6">
              {services.length === 0 ? "Nenhum serviço cadastrado" : "Nenhum serviço encontrado"}
            </p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Serviço
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredServices.map((service: any) => (
            <div
              key={service.id}
              className="border-l-4 border-l-chart-3 bg-card rounded-lg shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                )}
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-3 gap-8 flex-1 ml-8">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Preço</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatCurrency(service.price || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Duração</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {service.durationMinutes ?? service.duration_minutes ?? 0} min
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(service)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(service.id)}
                  className="border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
