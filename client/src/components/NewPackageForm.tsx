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
    packageType: "standard",
    baths: 5,
    groomings: 5,
    price: 0,
    expiryDate: "",
  });

  const { data: clients = [] } = trpc.clients.list.useQuery();
  const createMutation = trpc.packages.create.useMutation({
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
      packageType: formData.packageType,
      baths: formData.baths,
      groomings: formData.groomings,
      price: formData.price,
      expiryDate: new Date(formData.expiryDate).toISOString(),
    } as any);
  };

  const selectedClient = clients.find((c: any) => c.id === formData.clientId);
  const pets = selectedClient?.pets || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
