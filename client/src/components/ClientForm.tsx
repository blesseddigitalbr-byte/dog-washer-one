import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
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
    name: clientData?.name || clientData?.nome || "",
    email: clientData?.email || "",
    phone: clientData?.phone || "",
    cpf: clientData?.cpf || "",
    zipCode: clientData?.cep || "",
    address: clientData?.logradouro || "",
    number: clientData?.numero || "",
    complement: clientData?.complemento || "",
    city: clientData?.cidade || "",
    state: clientData?.uf || "",
    isVip: clientData?.is_vip || false,
    isModelDog: clientData?.is_model_dog || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const createMutation = trpc.clients.create.useMutation();
  const updateMutation = trpc.clients.update.useMutation();
  const utils = trpc.useUtils();

  const isEditing = !!clientId;
  const isLoading = createMutation.isPending || updateMutation.isPending || loadingCep;

  // Atualizar formData quando clientData mudar (para pré-preenchimento ao editar)
  useEffect(() => {
    if (clientData && isOpen) {
      setFormData({
        name: clientData.name || clientData.nome || "",
        email: clientData.email || "",
        phone: clientData.phone || "",
        cpf: clientData.cpf || "",
        zipCode: clientData.cep || "",
        address: clientData.logradouro || "",
        number: clientData.numero || "",
        complement: clientData.complemento || "",
        city: clientData.cidade || "",
        state: clientData.uf || "",
        isVip: clientData.is_vip || false,
        isModelDog: clientData.is_model_dog || false,
      });
    }
  }, [clientData, isOpen]);

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

  const handleCepChange = async (cep: string) => {
    setFormData({ ...formData, zipCode: cep });

    // Remove formatação e valida CEP
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            address: data.logradouro || "",
            city: data.localidade || "",
            state: data.uf || "",
            complement: data.complemento || "",
          }));
        } else {
          setErrors((prev) => ({ ...prev, zipCode: "CEP não encontrado" }));
        }
      } catch (error) {
        setErrors((prev) => ({ ...prev, zipCode: "Erro ao buscar CEP" }));
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        cep: formData.zipCode,
        logradouro: formData.address,
        numero: formData.number,
        complemento: formData.complement,
        cidade: formData.city,
        uf: formData.state,
        isVip: formData.isVip,
        isModelDog: formData.isModelDog,
      };

      if (isEditing && clientId) {
        await updateMutation.mutateAsync({
          id: clientId,
          ...submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }

      // Invalidate clients list to refetch
      await utils.clients.list.invalidate();

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        zipCode: "",
        address: "",
        number: "",
        complement: "",
        city: "",
        state: "",
        isVip: false,
        isModelDog: false,
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
      zipCode: "",
      address: "",
      number: "",
      complement: "",
      city: "",
      state: "",
      isVip: false,
      isModelDog: false,
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Nome Completo */}
          <div>
            <Label htmlFor="name" className="text-sm font-semibold text-foreground">
              Nome Completo *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Nome do cliente"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              className={errors.name ? "border-red-500 mt-1" : "mt-1"}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* CPF e Telefone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf" className="text-sm font-semibold text-foreground">
                CPF
              </Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => {
                  setFormData({ ...formData, cpf: e.target.value });
                  if (errors.cpf) setErrors({ ...errors, cpf: "" });
                }}
                className={errors.cpf ? "border-red-500 mt-1" : "mt-1"}
                disabled={isLoading}
              />
              {errors.cpf && (
                <p className="text-xs text-red-600 mt-1">{errors.cpf}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
                Telefone *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                className={errors.phone ? "border-red-500 mt-1" : "mt-1"}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">
              E-mail *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={errors.email ? "border-red-500 mt-1" : "mt-1"}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Endereço Completo */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-sm text-foreground">Endereço Completo</h3>
            </div>

            {/* CEP e Logradouro */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="zipCode" className="text-sm font-semibold text-foreground">
                  CEP
                </Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="00000-000"
                  value={formData.zipCode}
                  onChange={(e) => handleCepChange(e.target.value)}
                  className={errors.zipCode ? "border-red-500 mt-1" : "mt-1"}
                  disabled={isLoading}
                />
                {errors.zipCode && (
                  <p className="text-xs text-red-600 mt-1">{errors.zipCode}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-semibold text-foreground">
                  Logradouro
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Rua, Avenida..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Número e Complemento */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="number" className="text-sm font-semibold text-foreground">
                  Número
                </Label>
                <Input
                  id="number"
                  type="text"
                  placeholder="123"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="complement" className="text-sm font-semibold text-foreground">
                  Complemento
                </Label>
                <Input
                  id="complement"
                  type="text"
                  placeholder="Apto, Bloco..."
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Bairro, Cidade e UF */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm font-semibold text-foreground">
                  Cidade
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Cidade"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="state" className="text-sm font-semibold text-foreground">
                  UF
                </Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="SP"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div />
            </div>
          </div>

          {/* Checkboxes VIP e Modelo lado a lado */}
          <div className="grid grid-cols-2 gap-6 pt-4 bg-accent/5 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                id="isVip"
                checked={formData.isVip}
                onCheckedChange={(checked) => setFormData({ ...formData, isVip: checked as boolean })}
                disabled={isLoading}
                className="w-5 h-5"
              />
              <Label htmlFor="isVip" className="text-sm font-semibold text-foreground cursor-pointer flex-1">
                Cliente VIP
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="isModelDog"
                checked={formData.isModelDog}
                onCheckedChange={(checked) => setFormData({ ...formData, isModelDog: checked as boolean })}
                disabled={isLoading}
                className="w-5 h-5"
              />
              <Label htmlFor="isModelDog" className="text-sm font-semibold text-foreground cursor-pointer flex-1">
                Cliente Escola/Modelo
              </Label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Atualizar Cliente" : "Criar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
