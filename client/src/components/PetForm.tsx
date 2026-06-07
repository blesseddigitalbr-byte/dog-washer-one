import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PetFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  petId?: string | null;
  petData?: any | null;
  onSuccess?: () => void;
}

export function PetForm({
  isOpen,
  onClose,
  clientId,
  petId,
  petData,
  onSuccess,
}: PetFormProps) {
  const [formData, setFormData] = useState({
    name: petData?.name || "",
    breed: petData?.breed || "",
    species: petData?.species || "",
    color: petData?.color || "",
    birthDate: petData?.birthDate || "",
    weight: petData?.weight || "",
    microchip: petData?.microchip || "",
    notes: petData?.notes || "",
    photo: petData?.photo || "",
    status: petData?.status || "active",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = trpc.pets.create.useMutation();
  const updateMutation = trpc.pets.update.useMutation();
  const utils = trpc.useUtils();

  const isEditing = !!petId;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome do pet é obrigatório";
    }

    if (!formData.breed.trim()) {
      newErrors.breed = "Raça é obrigatória";
    }

    if (!formData.weight.trim()) {
      newErrors.weight = "Peso é obrigatório";
    } else if (isNaN(parseFloat(formData.weight))) {
      newErrors.weight = "Peso deve ser um número";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && petId) {
        await updateMutation.mutateAsync({
          id: petId,
          ...formData,
        });
      } else {
        await createMutation.mutateAsync({
          clientId: clientId,
          ...formData,
        });
      }

      // Invalidate clients to refetch
      await utils.clients.list.invalidate();
      await utils.clients.getById.invalidate({ id: clientId });

      // Reset form
      setFormData({
        name: "",
        breed: "",
        species: "",
        color: "",
        birthDate: "",
        weight: "",
        microchip: "",
        notes: "",
        photo: "",
        status: "active",
      });
      setErrors({});
      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar pet";
      setErrors({ submit: errorMessage });
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      breed: "",
      species: "",
      color: "",
      birthDate: "",
      weight: "",
      microchip: "",
      notes: "",
      photo: "",
      status: "active",
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Pet" : "Novo Pet"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm text-foreground">Informações Básicas</h3>

            {/* Name Field */}
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                Nome *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: Bento"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                className={errors.name ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Breed Field */}
            <div>
              <Label htmlFor="breed" className="text-sm font-semibold text-foreground">
                Raça *
              </Label>
              <Input
                id="breed"
                type="text"
                placeholder="Ex: Poodle"
                value={formData.breed}
                onChange={(e) => {
                  setFormData({ ...formData, breed: e.target.value });
                  if (errors.breed) setErrors({ ...errors, breed: "" });
                }}
                className={errors.breed ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.breed && (
                <p className="text-xs text-red-600 mt-1">{errors.breed}</p>
              )}
            </div>

            {/* Species Field */}
            <div>
              <Label htmlFor="species" className="text-sm font-semibold text-foreground">
                Espécie
              </Label>
              <Input
                id="species"
                type="text"
                placeholder="Ex: Cão"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* Color Field */}
            <div>
              <Label htmlFor="color" className="text-sm font-semibold text-foreground">
                Cor
              </Label>
              <Input
                id="color"
                type="text"
                placeholder="Ex: Branco"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* Weight Field */}
            <div>
              <Label htmlFor="weight" className="text-sm font-semibold text-foreground">
                Peso (kg) *
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Ex: 8.5"
                value={formData.weight}
                onChange={(e) => {
                  setFormData({ ...formData, weight: e.target.value });
                  if (errors.weight) setErrors({ ...errors, weight: "" });
                }}
                className={errors.weight ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.weight && (
                <p className="text-xs text-red-600 mt-1">{errors.weight}</p>
              )}
            </div>
          </div>

          {/* Informações Médicas */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm text-foreground">Informações Médicas</h3>

            {/* Birth Date Field */}
            <div>
              <Label htmlFor="birthDate" className="text-sm font-semibold text-foreground">
                Data de Nascimento
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* Microchip Field */}
            <div>
              <Label htmlFor="microchip" className="text-sm font-semibold text-foreground">
                Microchip
              </Label>
              <Input
                id="microchip"
                type="text"
                placeholder="Ex: 123456789"
                value={formData.microchip}
                onChange={(e) => setFormData({ ...formData, microchip: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* Notes Field */}
            <div>
              <Label htmlFor="notes" className="text-sm font-semibold text-foreground">
                Observações
              </Label>
              <textarea
                id="notes"
                placeholder="Notas adicionais sobre o pet"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
                rows={3}
              />
            </div>
          </div>

          {/* Mídia e Status */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm text-foreground">Mídia e Status</h3>

            {/* Photo Field */}
            <div>
              <Label htmlFor="photo" className="text-sm font-semibold text-foreground">
                Foto (URL)
              </Label>
              <Input
                id="photo"
                type="url"
                placeholder="Ex: https://..."
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* Status Field */}
            <div>
              <Label htmlFor="status" className="text-sm font-semibold text-foreground">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })} disabled={isLoading}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent/90 text-foreground"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Atualizar" : "Criar"} Pet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
