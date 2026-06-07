import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string | null;
  clientData?: {
    nome: string;
    email: string;
    phone: string;
  } | null;
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
    nome: clientData?.nome || "",
    email: clientData?.email || "",
    phone: clientData?.phone || "",
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

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
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
      setFormData({ nome: "", email: "", phone: "" });
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
    setFormData({ nome: "", email: "", phone: "" });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
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

          {/* Nome Field */}
          <div>
            <Label htmlFor="nome" className="text-sm font-semibold text-foreground">
              Nome *
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder="Ex: Helena Silveira"
              value={formData.nome}
              onChange={(e) => {
                setFormData({ ...formData, nome: e.target.value });
                if (errors.nome) setErrors({ ...errors, nome: "" });
              }}
              className={errors.nome ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.nome && (
              <p className="text-xs text-red-600 mt-1">{errors.nome}</p>
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
