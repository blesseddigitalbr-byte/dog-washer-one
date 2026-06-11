import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader } from "lucide-react";

interface StudentFormProps {
  isEditMode: boolean;
  formData: {
    name: string;
    email: string;
    phone: string;
    course: string;
    classGroup: string;
    academicStatus: string;
    instructorId: string;
    isAuthorized: boolean;
  };
  professionals: any[];
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: any) => void;
  onCancel: () => void;
}

export function StudentForm({
  isEditMode,
  formData,
  professionals,
  isLoading,
  onSubmit,
  onChange,
  onCancel,
}: StudentFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Nome completo"
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="(11) 99999-9999"
            className="mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="course">Curso</Label>
          <Input
            id="course"
            value={formData.course}
            onChange={(e) => onChange("course", e.target.value)}
            placeholder="Ex: Dog Washer"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="classGroup">Turma</Label>
          <Input
            id="classGroup"
            value={formData.classGroup}
            onChange={(e) => onChange("classGroup", e.target.value)}
            placeholder="Ex: Turma A"
            className="mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="academicStatus">Status Acadêmico</Label>
          <Select value={formData.academicStatus} onValueChange={(value) => onChange("academicStatus", value)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="instructorId">Instrutor Responsável</Label>
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
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isAuthorized"
          checked={formData.isAuthorized}
          onChange={(e) => onChange("isAuthorized", e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor="isAuthorized" className="cursor-pointer">
          Liberado para Prática
        </Label>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
          {isLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
          {isEditMode ? "Atualizar" : "Criar"} Aluno
        </Button>
      </div>
    </form>
  );
}
