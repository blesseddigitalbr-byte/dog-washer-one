import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string | null;
  clientData?: any | null;
  onSuccess?: () => void;
}

export function ClientForm({
  isOpen,
  onClose,
  clientId,
  clientData,
  onSuccess,
}: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: clientData?.name || "",
    email: clientData?.email || "",
    phone: clientData?.phone || "",
    cpf: clientData?.cpf || "",
    address: clientData?.address || "",
    city: clientData?.city || "",
    state: clientData?.state || "",
    zipCode: clientData?.zipCode || "",
    isVip: clientData?.isVip || false,
    status: clientData?.status || "active",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = trpc.clients.create.useMutation();
  const updateMutation = trpc.clients.update.useMutation();
  const utils = trpc.useUtils();

  const isEditing = !!clientId;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    }

    if (formData.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf)) {
      newErrors.cpf = "CPF deve estar no formato: 000.000.000-00";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && clientId) {
        await updateMutation.mutateAsync({
          id: clientId,
          ...formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }

      // Invalidate clients list to refetch
      await utils.clients.list.invalidate();

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        isVip: false,
        status: "active",
      });
      setErrors({});
      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar cliente";
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      isVip: false,
      status: "active",
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Informações Pessoais */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm text-foreground">Informações Pessoais</h3>

            {/* Nome Field */}
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                Nome *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: Helena Silveira"
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

            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: helena@email.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                className={errors.email ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
                Telefone *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ex: (11) 99999-0001"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                className={errors.phone ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>

            {/* CPF Field */}
            <div>
              <Label htmlFor="cpf" className="text-sm font-semibold text-foreground">
                CPF
              </Label>
              <Input
                id="cpf"
                type="text"
                placeholder="Ex: 000.000.000-00"
                value={formData.cpf}
                onChange={(e) => {
                  setFormData({ ...formData, cpf: e.target.value });
                  if (errors.cpf) setErrors({ ...errors, cpf: "" });
                }}
                className={errors.cpf ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.cpf && (
                <p className="text-xs text-red-600 mt-1">{errors.cpf}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm text-foreground">Endereço</h3>

            {/* Address Field */}
            <div>
              <Label htmlFor="address" className="text-sm font-semibold text-foreground">
                Endereço
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="Ex: Rua das Flores, 123"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* City Field */}
            <div>
              <Label htmlFor="city" className="text-sm font-semibold text-foreground">
                Cidade
              </Label>
              <Input
                id="city"
                type="text"
                placeholder="Ex: São Paulo"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* State Field */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="state" className="text-sm font-semibold text-foreground">
                  Estado
                </Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="Ex: SP"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  disabled={isLoading}
                />
              </div>

              {/* Zip Code Field */}
              <div>
                <Label htmlFor="zipCode" className="text-sm font-semibold text-foreground">
                  CEP
                </Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="Ex: 01234-567"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm text-foreground">Status</h3>

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
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* VIP Checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="isVip"
                type="checkbox"
                checked={formData.isVip}
                onChange={(e) => setFormData({ ...formData, isVip: e.target.checked })}
                disabled={isLoading}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="isVip" className="text-sm font-semibold text-foreground cursor-pointer">
                ⭐ Cliente VIP
              </Label>
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
              {isEditing ? "Atualizar" : "Criar"} Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
