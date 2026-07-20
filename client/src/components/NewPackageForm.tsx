import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface NewPackageFormProps {
  onClose: () => void;
}

export function NewPackageForm({ onClose }: NewPackageFormProps) {
  const [formData, setFormData] = useState({
    clientId: "",
    petId: "",
    packageId: "",
    baths: 5,
    groomings: 5,
    price: 0,
    contractDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
  });

  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: plans = [] } = trpc.packages.list.useQuery();
  const createMutation = trpc.clientPackages.create.useMutation({
    onSuccess: () => {
      toast.success("Pacote criado com sucesso!");
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar pacote: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || !formData.petId) {
      toast.error("Selecione cliente e pet");
      return;
    }

    const selectedClient = clients.find((c: any) => c.id === formData.clientId);
    const selectedPet = selectedClient?.pets?.find((p: any) => p.id === formData.petId);

    if (!selectedPet) {
      toast.error("Pet não encontrado");
      return;
    }

    await createMutation.mutateAsync({
      clientId: formData.clientId,
      petId: formData.petId,
      packageId: formData.packageId || undefined,
      baths: formData.baths,
      groomings: formData.groomings,
      price: formData.price,
      contractDate: formData.contractDate,
      expiryDate: formData.expiryDate || undefined,
    });
  };

  const selectedClient = clients.find((c: any) => c.id === formData.clientId);
  const pets = selectedClient?.pets || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="plan">Plano de referência</Label>
        <Select value={formData.packageId || "none"} onValueChange={(value) => {
          const plan = plans.find((item: any) => item.id === value);
          const expiry = new Date(`${formData.contractDate}T12:00:00`);
          if (plan?.duration_months) expiry.setMonth(expiry.getMonth() + Number(plan.duration_months));
          setFormData({
            ...formData,
            packageId: value === "none" ? "" : value,
            baths: plan?.total_baths ?? formData.baths,
            groomings: plan?.total_groomings ?? formData.groomings,
            price: Number(plan?.total_price ?? formData.price),
            expiryDate: plan?.duration_months ? expiry.toISOString().slice(0, 10) : formData.expiryDate,
          });
        }}>
          <SelectTrigger id="plan"><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Pacote personalizado</SelectItem>
            {plans.map((plan: any) => <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="client">Cliente *</Label>
        <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value, petId: "" })}>
          <SelectTrigger id="client">
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client: any) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="pet">Pet *</Label>
        <Select value={formData.petId} onValueChange={(value) => setFormData({ ...formData, petId: value })}>
          <SelectTrigger id="pet" disabled={!formData.clientId}>
            <SelectValue placeholder="Selecione um pet" />
          </SelectTrigger>
          <SelectContent>
            {pets.map((pet: any) => (
              <SelectItem key={pet.id} value={pet.id}>
                {pet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="baths">Banhos</Label>
          <Input
            id="baths"
            type="number"
            min="0"
            value={formData.baths}
            onChange={(e) => setFormData({ ...formData, baths: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="groomings">Tosas</Label>
          <Input
            id="groomings"
            type="number"
            min="0"
            value={formData.groomings}
            onChange={(e) => setFormData({ ...formData, groomings: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="price">Preço (R$)</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div>
        <Label htmlFor="contractDate">Data de Contratação</Label>
        <Input
          id="contractDate"
          type="date"
          value={formData.contractDate}
          onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="expiryDate">Data de Vencimento</Label>
        <Input
          id="expiryDate"
          type="date"
          value={formData.expiryDate}
          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Criando..." : "Criar Pacote"}
      </Button>
    </form>
  );
}
