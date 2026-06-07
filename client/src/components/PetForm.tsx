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
import { Checkbox } from "@/components/ui/checkbox";

interface PetFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  petId?: string | null;
  petData?: {
    name: string;
    breed: string;
    sexo: "M" | "F";
    cor_pelagem: string;
    weight: string;
    is_vip: boolean;
    is_model_dog: boolean;
  } | null;
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
    sexo: (petData?.sexo || "M") as "M" | "F",
    cor_pelagem: petData?.cor_pelagem || "",
    weight: petData?.weight || "",
    is_vip: petData?.is_vip || false,
    is_model_dog: petData?.is_model_dog || false,
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

    if (!formData.cor_pelagem.trim()) {
      newErrors.cor_pelagem = "Cor da pelagem é obrigatória";
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
          client_id: clientId,
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
        sexo: "M",
        cor_pelagem: "",
        weight: "",
        is_vip: false,
        is_model_dog: false,
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
      sexo: "M",
      cor_pelagem: "",
      weight: "",
      is_vip: false,
      is_model_dog: false,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* Sex Field */}
          <div>
            <Label htmlFor="sexo" className="text-sm font-semibold text-foreground">
              Sexo *
            </Label>
            <Select value={formData.sexo} onValueChange={(value) => setFormData({ ...formData, sexo: value as "M" | "F" })}>
              <SelectTrigger id="sexo" disabled={isLoading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Macho</SelectItem>
                <SelectItem value="F">Fêmea</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Field */}
          <div>
            <Label htmlFor="cor_pelagem" className="text-sm font-semibold text-foreground">
              Cor da Pelagem *
            </Label>
            <Input
              id="cor_pelagem"
              type="text"
              placeholder="Ex: Branco"
              value={formData.cor_pelagem}
              onChange={(e) => {
                setFormData({ ...formData, cor_pelagem: e.target.value });
                if (errors.cor_pelagem) setErrors({ ...errors, cor_pelagem: "" });
              }}
              className={errors.cor_pelagem ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.cor_pelagem && (
              <p className="text-xs text-red-600 mt-1">{errors.cor_pelagem}</p>
            )}
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

          {/* VIP Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-lg">
            <Checkbox
              id="is_vip"
              checked={formData.is_vip}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_vip: checked as boolean })
              }
              disabled={isLoading}
            />
            <Label htmlFor="is_vip" className="text-sm font-semibold text-foreground cursor-pointer">
              ⭐ VIP
            </Label>
          </div>

          {/* Model Dog Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Checkbox
              id="is_model_dog"
              checked={formData.is_model_dog}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_model_dog: checked as boolean })
              }
              disabled={isLoading}
            />
            <Label htmlFor="is_model_dog" className="text-sm font-semibold text-foreground cursor-pointer">
              🎯 Modelo
            </Label>
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
