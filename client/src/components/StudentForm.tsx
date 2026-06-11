import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StudentFormProps {
  isEditMode: boolean;
  formData: {
    name: string;
    email: string;
    phone: string;
    cpf?: string;
    photoUrl?: string;
    academicPortalId?: string;
    course: string;
    classGroup: string;
    academicStatus: string;
    instructorId: string;
    isAuthorized: boolean;
    blockReason?: string;
    practiceLevel?: string;
    needsSupervisión?: boolean;
    canWorkAlone?: boolean;
    allowedServices?: string[];
    allowedDogSizes?: string[];
    petStatus?: string[];
    notes?: string;
  };
  professionals: any[];
  services?: any[];
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: any) => void;
  onCancel: () => void;
}

export function StudentForm({
  isEditMode,
  formData,
  professionals,
  services = [],
  isLoading,
  onSubmit,
  onChange,
  onCancel,
}: StudentFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(formData.photoUrl || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Foto muito grande. Máximo 5MB.");
        return;
      }

      // Validar tipo
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas.");
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhotoToS3 = async (): Promise<string | null> => {
    if (!photoFile) return formData.photoUrl || null;

    try {
      setIsUploadingPhoto(true);
      const buffer = await photoFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binaryString = "";
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binaryString);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `student_${Date.now()}_${photoFile.name}`,
          mimeType: photoFile.type,
          fileData: base64,
          studentId: formData.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao fazer upload da foto");
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da foto");
      return null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    onChange("photoUrl", "");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Upload foto se houver arquivo novo
      if (photoFile) {
        const photoUrl = await uploadPhotoToS3();
        if (photoUrl) {
          onChange("photoUrl", photoUrl);
        }
      }

      // Chamar submit original
      onSubmit(e);
    } catch (error) {
      console.error("Erro no submit:", error);
      toast.error("Erro ao salvar aluno");
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    const current = formData.allowedServices || [];
    const updated = current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];
    onChange("allowedServices", updated);
  };

  const handleDogSizeToggle = (size: string) => {
    const current = formData.allowedDogSizes || [];
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    onChange("allowedDogSizes", updated);
  };

  const handlePetStatusToggle = (status: string) => {
    const current = formData.petStatus || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onChange("petStatus", updated);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 max-h-[90vh] overflow-y-auto pb-20">
      {/* SEÇÃO 1: DADOS PESSOAIS */}
      <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="font-medium">
              Nome Completo *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Nome completo do aluno"
              className="mt-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="email@example.com"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="font-medium">
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cpf" className="font-medium">
              CPF
            </Label>
            <Input
              id="cpf"
              value={formData.cpf || ""}
              onChange={(e) => onChange("cpf", e.target.value)}
              placeholder="000.000.000-00"
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: DADOS ACADÊMICOS */}
      <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Dados Acadêmicos</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="academicPortalId" className="font-medium">
              ID do Portal Acadêmico
            </Label>
            <Input
              id="academicPortalId"
              value={formData.academicPortalId || ""}
              onChange={(e) => onChange("academicPortalId", e.target.value)}
              placeholder="ID do portal acadêmico"
              className="mt-2"
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="course" className="font-medium">
                Curso
              </Label>
              <Input
                id="course"
                value={formData.course}
                onChange={(e) => onChange("course", e.target.value)}
                placeholder="Ex: Dog Washer"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="classGroup" className="font-medium">
                Turma
              </Label>
              <Input
                id="classGroup"
                value={formData.classGroup}
                onChange={(e) => onChange("classGroup", e.target.value)}
                placeholder="Ex: Turma A"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="academicStatus" className="font-medium">
              Status Acadêmico
            </Label>
            <Select value={formData.academicStatus} onValueChange={(value) => onChange("academicStatus", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: DADOS OPERACIONAIS */}
      <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Dados Operacionais</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="instructorId" className="font-medium">
              Instrutor Responsável *
            </Label>
            <Select value={formData.instructorId} onValueChange={(value) => onChange("instructorId", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione um instrutor" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((prof: any) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-purple-200">
            <Checkbox
              id="isAuthorized"
              checked={formData.isAuthorized}
              onCheckedChange={(checked) => onChange("isAuthorized", checked)}
            />
            <Label htmlFor="isAuthorized" className="font-medium cursor-pointer flex-1">
              Liberado para Prática
            </Label>
          </div>

          {!formData.isAuthorized && (
            <div>
              <Label htmlFor="blockReason" className="font-medium">
                Motivo do Bloqueio
              </Label>
              <Input
                id="blockReason"
                value={formData.blockReason || ""}
                onChange={(e) => onChange("blockReason", e.target.value)}
                placeholder="Ex: Falta de documentação, não completou pré-requisitos"
                className="mt-2"
              />
            </div>
          )}

          <div>
            <Label htmlFor="practiceLevel" className="font-medium">
              Nível Prático
            </Label>
            <Select value={formData.practiceLevel || ""} onValueChange={(value) => onChange("practiceLevel", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
                <SelectItem value="expert">Especialista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-purple-200">
              <Checkbox
                id="needsSupervisión"
                checked={formData.needsSupervisión || false}
                onCheckedChange={(checked) => onChange("needsSupervisión", checked)}
              />
              <Label htmlFor="needsSupervisión" className="font-medium cursor-pointer flex-1">
                Precisa de Supervisão
              </Label>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-purple-200">
              <Checkbox
                id="canWorkAlone"
                checked={formData.canWorkAlone || false}
                onCheckedChange={(checked) => onChange("canWorkAlone", checked)}
              />
              <Label htmlFor="canWorkAlone" className="font-medium cursor-pointer flex-1">
                Pode Atender Sozinho
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: PERMISSÕES */}
      <div className="p-6 rounded-lg border-l-4" style={{ backgroundColor: "#f5f1eb", borderLeftColor: "#8e6e3e" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 text-white rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: "#8e6e3e" }}>
            4
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Permissões</h3>
        </div>

        <div className="space-y-6">
          {/* Serviços Permitidos */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Serviços Permitidos</h4>
            <div className="grid grid-cols-2 gap-3">
              {services.length > 0 ? (
                services.map((service: any) => (
                  <div key={service.id} className="flex items-center gap-2 p-2 bg-white rounded border border-amber-200">
                    <Checkbox
                      id={`service-${service.id}`}
                      checked={(formData.allowedServices || []).includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                    />
                    <Label htmlFor={`service-${service.id}`} className="cursor-pointer text-sm flex-1">
                      {service.name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 col-span-2">Nenhum serviço disponível</p>
              )}
            </div>
          </div>

          {/* Portes de Cães Permitidos */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Portes de Cães Permitidos</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "small", label: "Pequeno (até 5kg)" },
                { id: "medium", label: "Médio (5-15kg)" },
                { id: "large", label: "Grande (15-30kg)" },
                { id: "giant", label: "Gigante (acima de 30kg)" },
              ].map((size) => (
                <div key={size.id} className="flex items-center gap-2 p-2 bg-white rounded border border-amber-200">
                  <Checkbox
                    id={`size-${size.id}`}
                    checked={(formData.allowedDogSizes || []).includes(size.id)}
                    onCheckedChange={() => handleDogSizeToggle(size.id)}
                  />
                  <Label htmlFor={`size-${size.id}`} className="cursor-pointer text-sm flex-1">
                    {size.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Status do Pet */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Status do Pet Atendido</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "vip", label: "VIP" },
                { id: "model_dog", label: "Cão Modelo" },
              ].map((status) => (
                <div key={status.id} className="flex items-center gap-2 p-2 bg-white rounded border border-amber-200">
                  <Checkbox
                    id={`status-${status.id}`}
                    checked={(formData.petStatus || []).includes(status.id)}
                    onCheckedChange={() => handlePetStatusToggle(status.id)}
                  />
                  <Label htmlFor={`status-${status.id}`} className="cursor-pointer text-sm flex-1">
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 5: FOTO DO ALUNO */}
      <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
            5
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Foto do Aluno</h3>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-100 transition">
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-indigo-600 mb-2" />
                <span className="text-sm text-indigo-600 font-semibold">Clique para enviar foto</span>
                <span className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</span>
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" disabled={isUploadingPhoto} />
            </label>
          </div>

          {photoPreview && (
            <div className="relative w-32 h-32">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-lg border-2 border-indigo-300" />
              <button
                type="button"
                onClick={removePhoto}
                disabled={isUploadingPhoto}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
              >
                {isUploadingPhoto ? <Loader className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 6: OBSERVAÇÕES */}
      <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
            6
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Observações</h3>
        </div>

        <textarea
          value={formData.notes || ""}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Observações operacionais, restrições especiais, etc..."
          className="w-full p-3 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={4}
        />
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="flex gap-2 justify-end pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || isUploadingPhoto} className="bg-amber-600 hover:bg-amber-700 text-white">
          {isLoading || isUploadingPhoto ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
          {isEditMode ? "Atualizar" : "Criar"} Aluno
        </Button>
      </div>
    </form>
  );
}
