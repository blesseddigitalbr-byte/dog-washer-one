import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Students() {
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    photoUrl: "",
    course: "",
    classGroup: "",
    academicStatus: "active",
    academicId: "",
    instructorId: "",
    isAuthorized: false,
    blockReason: "",
    practiceLevel: "beginner",
    petStatus: [] as string[],
    needsSupervision: false,
    canWorkAlone: false,
    allowedServices: [] as string[],
    notes: "",
  });

  // Queries
  const { data: students = [], isLoading: loadingStudents, refetch: refetchStudents } = trpc.students.list.useQuery();
  const { data: professionals = [] } = trpc.professionals.list.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();

  // Mutations
  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      toast.success("Aluno criado com sucesso!");
      refetchStudents({ throwOnError: false });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar aluno: ${error.message}`);
    },
  });

  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      toast.success("Aluno atualizado com sucesso!");
      refetchStudents({ throwOnError: false });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar aluno: ${error.message}`);
    },
  });

  const deleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success("Aluno deletado com sucesso!");
      refetchStudents();
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar aluno: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      photoUrl: "",
      course: "",
      classGroup: "",
      academicStatus: "active",
      academicId: "",
      instructorId: "",
      isAuthorized: false,
      blockReason: "",
      practiceLevel: "beginner",
      petStatus: [],
      needsSupervision: false,
      canWorkAlone: false,
      allowedServices: [],
      notes: "",
    });
    setPhotoFile(null);
    setPhotoPreview("");
    setSelectedStudent(null);
    setIsEditMode(false);
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    const payload: any = {
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      name: formData.name,
      academicStatus: formData.academicStatus,
      isAuthorized: formData.isAuthorized,
      practiceLevel: formData.practiceLevel,
      needsSupervision: formData.needsSupervision,
      canWorkAlone: formData.canWorkAlone,
    };

    if (formData.email) payload.email = formData.email;
    if (formData.phone) payload.phone = formData.phone;
    if (formData.cpf) payload.cpf = formData.cpf;
    if (formData.photoUrl) payload.photoUrl = formData.photoUrl;
    if (formData.course) payload.course = formData.course;
    if (formData.classGroup) payload.classGroup = formData.classGroup;
    if (formData.academicId) payload.academicId = formData.academicId;
    if (formData.instructorId) payload.instructorId = formData.instructorId;
    if (formData.blockReason) payload.blockReason = formData.blockReason;
    if (formData.allowedServices?.length > 0) payload.allowedServices = JSON.stringify(formData.allowedServices);
    if (formData.notes) payload.notes = formData.notes;

    createMutation.mutate(payload);
  };

  const handleEdit = () => {
    if (!selectedStudent) return;

    const payload: any = {
      id: selectedStudent.id,
      name: formData.name,
      academicStatus: formData.academicStatus,
      isAuthorized: formData.isAuthorized,
      practiceLevel: formData.practiceLevel,
      needsSupervision: formData.needsSupervision,
      canWorkAlone: formData.canWorkAlone,
    };

    if (formData.email) payload.email = formData.email;
    if (formData.phone) payload.phone = formData.phone;
    if (formData.photoUrl) payload.photoUrl = formData.photoUrl;
    if (formData.course) payload.course = formData.course;
    if (formData.classGroup) payload.classGroup = formData.classGroup;
    if (formData.instructorId) payload.instructorId = formData.instructorId;
    if (formData.blockReason) payload.blockReason = formData.blockReason;
    if (formData.allowedServices?.length > 0) payload.allowedServices = JSON.stringify(formData.allowedServices);
    if (formData.notes) payload.notes = formData.notes;

    updateMutation.mutate(payload);
  };

  const openEditDialog = (student: any) => {
    setSelectedStudent(student);
    setIsEditMode(true);
    setFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      cpf: student.cpf || "",
      photoUrl: student.photo_url || "",
      course: student.course || "",
      classGroup: student.class_group || "",
      academicStatus: student.academic_status || "active",
      academicId: student.academic_id || "",
      instructorId: student.instructor_id || "",
      isAuthorized: student.is_authorized || false,
      blockReason: student.block_reason || "",
      practiceLevel: student.practice_level || "beginner",
      petStatus: student.pet_status ? JSON.parse(student.pet_status) : [],
      needsSupervision: student.needs_supervision || false,
      canWorkAlone: student.can_work_alone || false,
      allowedServices: student.allowed_services ? JSON.parse(student.allowed_services) : [],
      notes: student.notes || "",
    });
    setOpenDialog(true);
  };

  const openNewDialog = () => {
    setIsEditMode(false);
    setSelectedStudent(null);
    resetForm();
    setOpenDialog(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Foto deve ter no máximo 5MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Filters
  const filteredStudents = useMemo(() => {
    return students.filter((student: any) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStatus === "authorized") return matchesSearch && student.is_authorized;
      if (filterStatus === "blocked") return matchesSearch && !student.is_authorized;
      return matchesSearch;
    });
  }, [students, searchTerm, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s: any) => s.academic_status === "active").length;
    const courses = new Set(students.map((s: any) => s.course)).size;
    return { total, active, courses };
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alunos</h1>
          <p className="text-gray-600 mt-1">Gerencie os alunos do salão-escola</p>
        </div>
        <Button 
          onClick={openNewDialog}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          + Novo Aluno
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border-l-4 border-l-amber-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Alunos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="text-3xl text-gray-400">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border-l-4 border-l-amber-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Alunos Ativos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
            </div>
            <div className="text-3xl text-gray-400">✓</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border-l-4 border-l-amber-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Práticas Realizadas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="text-3xl text-gray-400">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border-l-4 border-l-amber-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Cursos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.courses}</p>
            </div>
            <div className="text-3xl text-gray-400">📚</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="authorized">Autorizados</SelectItem>
            <SelectItem value="blocked">Bloqueados</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">Relatório</Button>
      </div>

      {/* Students List */}
      <div className="space-y-3">
        {loadingStudents ? (
          <div className="text-center py-8 text-gray-500">Carregando alunos...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum aluno encontrado</div>
        ) : (
          filteredStudents.map((student: any) => (
            <div key={student.id} className="bg-white rounded-lg border-l-4 border-l-amber-600 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8 mt-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Curso</p>
                      <p className="text-sm font-medium text-gray-900">{student.course || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Data de Inscrição</p>
                      <p className="text-sm font-medium text-gray-900">
                        {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString("pt-BR") : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Progresso</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-amber-600 h-2 rounded-full"
                            style={{ width: "0%" }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">0%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={student.is_authorized ? "default" : "secondary"}>
                    {student.is_authorized ? "Ativo" : "Bloqueado"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(student)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(student.id)}
                  >
                    Deletar
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Aluno" : "Novo Aluno"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Seção 1: Dados Pessoais */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-bold text-gray-900 mb-3">1. Dados Pessoais</h3>
              <div className="space-y-3">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CPF</Label>
                    <Input
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>Foto</Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                    {photoPreview && (
                      <img src={photoPreview} alt="Preview" className="mt-2 w-20 h-20 rounded-lg" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Dados Acadêmicos */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-bold text-gray-900 mb-3">2. Dados Acadêmicos</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>ID Portal</Label>
                    <Input
                      value={formData.academicId}
                      onChange={(e) => setFormData({ ...formData, academicId: e.target.value })}
                      placeholder="ID do Portal Acadêmico"
                    />
                  </div>
                  <div>
                    <Label>Curso</Label>
                    <Input
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      placeholder="Ex: Dog Washer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Turma</Label>
                    <Input
                      value={formData.classGroup}
                      onChange={(e) => setFormData({ ...formData, classGroup: e.target.value })}
                      placeholder="Ex: Turma A"
                    />
                  </div>
                  <div>
                    <Label>Status Acadêmico</Label>
                    <Select value={formData.academicStatus} onValueChange={(value) => setFormData({ ...formData, academicStatus: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Dados Operacionais */}
            <div className="border rounded-lg p-4 bg-purple-50">
              <h3 className="font-bold text-gray-900 mb-3">3. Dados Operacionais</h3>
              <div className="space-y-3">
                <div>
                  <Label>Instrutor Responsável</Label>
                  <Select value={formData.instructorId} onValueChange={(value) => setFormData({ ...formData, instructorId: value })}>
                    <SelectTrigger>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.isAuthorized}
                      onCheckedChange={(checked) => setFormData({ ...formData, isAuthorized: checked as boolean })}
                    />
                    <Label>Liberado para Prática</Label>
                  </div>
                  <div>
                    <Label>Nível Prático</Label>
                    <Select value={formData.practiceLevel} onValueChange={(value) => setFormData({ ...formData, practiceLevel: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Iniciante</SelectItem>
                        <SelectItem value="intermediate">Intermediário</SelectItem>
                        <SelectItem value="advanced">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!formData.isAuthorized && (
                  <div>
                    <Label>Motivo do Bloqueio</Label>
                    <Input
                      value={formData.blockReason}
                      onChange={(e) => setFormData({ ...formData, blockReason: e.target.value })}
                      placeholder="Motivo do bloqueio"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.needsSupervision}
                      onCheckedChange={(checked) => setFormData({ ...formData, needsSupervision: checked as boolean })}
                    />
                    <Label>Precisa de Supervisão</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.canWorkAlone}
                      onCheckedChange={(checked) => setFormData({ ...formData, canWorkAlone: checked as boolean })}
                    />
                    <Label>Pode Atender Sozinho</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 4: Status do Pet */}
            <div className="border rounded-lg p-4 bg-orange-50">
              <h3 className="font-bold text-gray-900 mb-3">4. Status do Pet Atendido</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.petStatus.includes("vip")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ ...formData, petStatus: [...formData.petStatus, "vip"] });
                      } else {
                        setFormData({ ...formData, petStatus: formData.petStatus.filter(s => s !== "vip") });
                      }
                    }}
                  />
                  <Label>VIP</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.petStatus.includes("modelo")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ ...formData, petStatus: [...formData.petStatus, "modelo"] });
                      } else {
                        setFormData({ ...formData, petStatus: formData.petStatus.filter(s => s !== "modelo") });
                      }
                    }}
                  />
                  <Label>Cão Modelo</Label>
                </div>
              </div>
            </div>

            {/* Seção 5: Observações */}
            <div className="border rounded-lg p-4 bg-red-50">
              <h3 className="font-bold text-gray-900 mb-3">5. Observações</h3>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações operacionais..."
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={isEditMode ? handleEdit : handleCreate}
                className="bg-amber-600 hover:bg-amber-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditMode ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Deletar Aluno</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar este aluno? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  deleteMutation.mutate({ id: deleteConfirm });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
