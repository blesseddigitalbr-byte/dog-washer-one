import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Loader2, Upload, History } from "lucide-react";
import { toast } from "sonner";
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
  petData?: any | null;
  onSuccess?: () => void;
}

const BREEDS = [
  "Poodle",
  "Shih Tzu",
  "Golden Retriever",
  "Labrador",
  "Bulldog Francês",
  "Dálmata",
  "Pastor Alemão",
  "Beagle",
  "Cocker Spaniel",
  "Dachshund",
  "Pinscher",
  "Schnauzer",
  "Maltês",
  "Yorkshire Terrier",
  "Lhasa Apso",
  "Pug",
  "Boxer",
  "Rottweiler",
  "Husky",
  "Outro",
];

const SIZES = [
  { id: "p", label: "Pequeno (P)" },
  { id: "m", label: "Médio (M)" },
  { id: "g", label: "Grande (G)" },
  { id: "gg", label: "Gigante (GG)" },
];

const COAT_TYPES = [
  "Curta",
  "Média",
  "Longa",
  "Crespa",
  "Ondulada",
  "Dupla",
  "Áspera",
];

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
    size: petData?.size || "",
    coatType: petData?.coatType || "",
    species: petData?.species || "",
    color: petData?.color || "",
    birthDate: petData?.birthDate || "",
    weight: petData?.weight || "",
    microchip: petData?.microchip || "",
    notes: petData?.notes || "",
    photo: petData?.photo || "",
    status: petData?.status || "active",
    vaccines: petData?.vaccines ? JSON.parse(petData.vaccines) : [],
    dewormed: petData?.dewormed || false,
    hasDiseasesOrAllergies: petData?.hasDiseasesOrAllergies || false,
    diseasesOrAllergiesDescription: petData?.diseasesOrAllergiesDescription || "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(petData?.photo || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = trpc.pets.create.useMutation();
  const updateMutation = trpc.pets.update.useMutation();
  const utils = trpc.useUtils();

  const isEditing = !!petId;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const availableVaccines = [
    { id: "raiva", label: "Raiva" },
    { id: "multipla", label: "Múltipla" },
    { id: "giardia", label: "Giardia" },
    { id: "leishmaniose", label: "Leishmaniose" },
    { id: "leptospirose", label: "Leptospirose" },
    { id: "parvovirose", label: "Parvovirose" },
    { id: "cinomose", label: "Cinomose" },
    { id: "tosse_canil", label: "Tosse do Canil" },
    { id: "outras", label: "Outras" },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome do pet é obrigatório";
    }

    if (!formData.breed) {
      newErrors.breed = "Raça é obrigatória";
    }

    if (!formData.weight.trim()) {
      newErrors.weight = "Peso é obrigatório";
    } else if (isNaN(parseFloat(formData.weight))) {
      newErrors.weight = "Peso deve ser um número";
    }

    if (formData.hasDiseasesOrAllergies && !formData.diseasesOrAllergiesDescription.trim()) {
      newErrors.diseasesOrAllergiesDescription = "Descreva as doenças ou alergias";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVaccineChange = (vaccineId: string) => {
    setFormData((prev) => ({
      ...prev,
      vaccines: prev.vaccines.includes(vaccineId)
        ? prev.vaccines.filter((v: string) => v !== vaccineId)
        : [...prev.vaccines, vaccineId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const submitData = {
        ...formData,
        photo: formData.photo,
        vaccines: JSON.stringify(formData.vaccines),
        clientId,
      };

      if (isEditing && petId) {
        await updateMutation.mutateAsync({ id: petId, ...submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }

      await utils.clients.getById.invalidate({ id: clientId });
      
      const action = isEditing ? "atualizado" : "criado";
      toast.success(`Pet ${action} com sucesso!`);
      
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      setErrors({ submit: error.message || "Erro ao salvar pet" });
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      breed: "",
      size: "",
      coatType: "",
      species: "",
      color: "",
      birthDate: "",
      weight: "",
      microchip: "",
      notes: "",
      photo: "",
      status: "active",
      vaccines: [],
      dewormed: false,
      hasDiseasesOrAllergies: false,
      diseasesOrAllergiesDescription: "",
    });
    setPhotoFile(null);
    setPhotoPreview("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">{isEditing ? "Editar Pet" : "Novo Pet"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Foto do Pet */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm text-foreground">Foto do Pet</h3>
            
            <div className="flex gap-4">
              {photoPreview && (
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={photoPreview} alt="Pet" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="flex-1">
                <Label htmlFor="photoFile" className="text-sm font-semibold text-foreground block mb-2">
                  Upload de Foto
                </Label>
                <div className="border-2 border-dashed border-accent/30 rounded-lg p-4 text-center cursor-pointer hover:border-accent/50 transition-colors">
                  <input
                    id="photoFile"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <label htmlFor="photoFile" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-5 h-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Clique para fazer upload</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

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

            {/* Breed and Size - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Breed Field */}
              <div>
                <Label htmlFor="breed" className="text-sm font-semibold text-foreground">
                  Raça *
                </Label>
                <Select
                  value={formData.breed}
                  onValueChange={(value) => {
                    setFormData({ ...formData, breed: value });
                    if (errors.breed) setErrors({ ...errors, breed: "" });
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className={errors.breed ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione a raça" />
                  </SelectTrigger>
                  <SelectContent>
                    {BREEDS.map((breed) => (
                      <SelectItem key={breed} value={breed}>
                        {breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.breed && (
                  <p className="text-xs text-red-600 mt-1">{errors.breed}</p>
                )}
              </div>

              {/* Size Field */}
              <div>
                <Label htmlFor="size" className="text-sm font-semibold text-foreground">
                  Porte
                </Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => setFormData({ ...formData, size: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o porte" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((size) => (
                      <SelectItem key={size.id} value={size.id}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Color, Coat Type and Weight - Side by Side */}
            <div className="grid grid-cols-3 gap-4">
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

              {/* Coat Type Field */}
              <div>
                <Label htmlFor="coatType" className="text-sm font-semibold text-foreground">
                  Pelagem
                </Label>
                <Select
                  value={formData.coatType}
                  onValueChange={(value) => setFormData({ ...formData, coatType: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {COAT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          </div>

          {/* Informações Médicas */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm text-foreground">Informações Médicas</h3>

            {/* Birth Date */}
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

            {/* Microchip */}
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

            {/* Vaccines */}
            <div>
              <Label className="text-sm font-semibold text-foreground mb-2 block">
                Vacinas Atualizadas
              </Label>
              <div className="border border-accent/30 rounded-lg p-4 bg-accent/5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {availableVaccines.map((vaccine) => (
                    <div key={vaccine.id} className="flex items-center gap-2">
                      <Checkbox
                        id={vaccine.id}
                        checked={formData.vaccines.includes(vaccine.id)}
                        onCheckedChange={() => handleVaccineChange(vaccine.id)}
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={vaccine.id}
                        className="text-sm font-medium text-foreground cursor-pointer"
                      >
                        {vaccine.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dewormed */}
            <div className="flex items-center gap-3 bg-accent/5 p-3 rounded-lg">
              <Checkbox
                id="dewormed"
                checked={formData.dewormed}
                onCheckedChange={(checked) => setFormData({ ...formData, dewormed: checked as boolean })}
                disabled={isLoading}
              />
              <Label htmlFor="dewormed" className="text-sm font-semibold text-foreground cursor-pointer">
                Vermífugo em dia
              </Label>
            </div>

            {/* Diseases or Allergies */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-accent/5 p-3 rounded-lg">
                <Checkbox
                  id="hasDiseasesOrAllergies"
                  checked={formData.hasDiseasesOrAllergies}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasDiseasesOrAllergies: checked as boolean })}
                  disabled={isLoading}
                />
                <Label htmlFor="hasDiseasesOrAllergies" className="text-sm font-semibold text-foreground cursor-pointer">
                  Possui doenças ou alergias
                </Label>
              </div>

              {formData.hasDiseasesOrAllergies && (
                <div>
                  <Label htmlFor="diseasesDescription" className="text-sm font-semibold text-foreground">
                    Descrição
                  </Label>
                  <textarea
                    id="diseasesDescription"
                    placeholder="Descreva as doenças ou alergias..."
                    value={formData.diseasesOrAllergiesDescription}
                    onChange={(e) => setFormData({ ...formData, diseasesOrAllergiesDescription: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg text-sm"
                    disabled={isLoading}
                    rows={3}
                  />
                  {errors.diseasesOrAllergiesDescription && (
                    <p className="text-xs text-red-600 mt-1">{errors.diseasesOrAllergiesDescription}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm text-foreground">Observações</h3>
            <textarea
              placeholder="Adicione observações sobre o pet..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border border-border rounded-lg text-sm"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm text-foreground">Status</h3>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90 text-foreground"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Atualizar Pet" : "Criar Pet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
