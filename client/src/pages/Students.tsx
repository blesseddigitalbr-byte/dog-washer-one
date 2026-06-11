import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search, Filter, X } from "lucide-react";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

export default function StudentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
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
    needsSupervision: true,
    canWorkAlone: false,
    allowedServices: [],
    allowedDogSizes: [],
    notes: "",
  });

  // Fetch students
  const { data: students = [], isLoading, refetch } = trpc.students.list.useQuery({
    filter: filterStatus === "all" ? "all" : filterStatus === "authorized" ? "authorized" : "blocked",
  });

  // Fetch professionals (for instructor selection)
  const { data: professionals = [] } = trpc.professionals.list.useQuery();

  // Create mutation
  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      toast.success("Aluno criado com sucesso!");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar aluno");
    },
  });

  // Update mutation
  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      toast.success("Aluno atualizado com sucesso!");
      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar aluno");
    },
  });

  // Delete mutation
  const deleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success("Aluno deletado com sucesso!");
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar aluno");
    },
  });

  // Filter and search
  const filteredStudents = useMemo(() => {
    return (students || []).filter((student: any) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [students, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

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
      needsSupervision: true,
      canWorkAlone: false,
      allowedServices: [],
      allowedDogSizes: [],
      notes: "",
    });
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      await createMutation.mutateAsync({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        ...formData,
      });
    } catch (error) {
      console.error("Error creating student:", error);
    }
  };

  const handleEdit = (student: any) => {
    setSelectedStudent(student);
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
      needsSupervision: student.needs_supervision !== false,
      canWorkAlone: student.can_work_alone || false,
      allowedServices: student.allowed_services ? JSON.parse(student.allowed_services) : [],
      allowedDogSizes: student.allowed_dog_sizes ? JSON.parse(student.allowed_dog_sizes) : [],
      notes: student.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedStudent.id,
        ...formData,
      });
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: selectedStudent.id });
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getAuthorizationBadge = (isAuthorized: boolean) => {
    return isAuthorized
      ? <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Autorizado</span>
      : <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Bloqueado</span>;
  };

  const getPracticeLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-blue-100 text-blue-800",
      intermediate: "bg-yellow-100 text-yellow-800",
      advanced: "bg-purple-100 text-purple-800",
    };
    return <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${colors[level] || "bg-gray-100 text-gray-800"}`}>{level}</span>;
  };

  const stats = {
    total: students?.length || 0,
    authorized: students?.filter((s: any) => s.is_authorized).length || 0,
    blocked: students?.filter((s: any) => !s.is_authorized).length || 0,
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Alunos - Salão-Escola</h1>
          <p className="text-muted-foreground">Gerencie alunos autorizados para prática no salão-escola</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-green-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Autorizados</p>
                <p className="text-2xl font-bold text-foreground">{stats.authorized}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-red-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bloqueados</p>
                <p className="text-2xl font-bold text-foreground">{stats.blocked}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={(value) => {
            setFilterStatus(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="authorized">Autorizados</SelectItem>
              <SelectItem value="blocked">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Aluno</DialogTitle>
              </DialogHeader>
              <StudentForm
                formData={formData}
                setFormData={setFormData}
                professionals={professionals}
                onSubmit={handleCreate}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Students List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando alunos...</p>
          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum aluno encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedStudents.map((student: any) => (
              <div key={student.id} className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-l-accent hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {getAuthorizationBadge(student.is_authorized)}
                    {getPracticeLevelBadge(student.practice_level)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">CURSO</p>
                    <p className="text-sm font-medium text-foreground">{student.course || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">TURMA</p>
                    <p className="text-sm font-medium text-foreground">{student.class_group || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">INSTRUTOR</p>
                    <p className="text-sm font-medium text-foreground">{student.instructor?.name || "-"}</p>
                  </div>
                  <div className="flex items-end gap-2">
                    <Dialog open={isEditDialogOpen && selectedStudent?.id === student.id} onOpenChange={(open) => {
                      if (!open) {
                        setIsEditDialogOpen(false);
                        resetForm();
                      }
                    }}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-2 hover:bg-accent/10 rounded-lg text-accent transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar Aluno</DialogTitle>
                        </DialogHeader>
                        <StudentForm
                          formData={formData}
                          setFormData={setFormData}
                          professionals={professionals}
                          onSubmit={handleUpdate}
                          isLoading={updateMutation.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {student.block_reason && !student.is_authorized && (
                  <div className="text-xs text-muted-foreground bg-red-50 p-3 rounded mb-3">
                    <strong>Motivo do bloqueio:</strong> {student.block_reason}
                  </div>
                )}

                {student.notes && (
                  <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
                    <strong>Observações:</strong> {student.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Deletar Aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar {selectedStudent?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deletando..." : "Deletar"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Pagination */}
        {paginatedStudents.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>👥 {filteredStudents.length} alunos encontrados</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)} de {filteredStudents.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md hover:bg-accent/20 text-foreground hover:text-accent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md hover:bg-accent/20 text-foreground hover:text-accent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Student Form Component - Expandido com todos os campos
function StudentForm({ formData, setFormData, professionals, onSubmit, isLoading }: any) {
  const serviceOptions = [
    { value: "banho", label: "Banho" },
    { value: "tosa", label: "Tosa" },
    { value: "hidratacao", label: "Hidratação" },
    { value: "escovacao", label: "Escovação" },
    { value: "limpeza_ouvidos", label: "Limpeza de Ouvidos" },
    { value: "corte_unhas", label: "Corte de Unhas" },
  ];

  const dogSizeOptions = [
    { value: "pequeno", label: "Pequeno (até 5kg)" },
    { value: "medio", label: "Médio (5-15kg)" },
    { value: "grande", label: "Grande (15-30kg)" },
    { value: "gigante", label: "Gigante (acima de 30kg)" },
  ];

  const toggleService = (service: string) => {
    const services = formData.allowedServices || [];
    if (services.includes(service)) {
      setFormData({ ...formData, allowedServices: services.filter((s: string) => s !== service) });
    } else {
      setFormData({ ...formData, allowedServices: [...services, service] });
    }
  };

  const toggleDogSize = (size: string) => {
    const sizes = formData.allowedDogSizes || [];
    if (sizes.includes(size)) {
      setFormData({ ...formData, allowedDogSizes: sizes.filter((s: string) => s !== size) });
    } else {
      setFormData({ ...formData, allowedDogSizes: [...sizes, size] });
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Seção 1: Dados Pessoais */}
      <div className="border-b pb-6">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">1</span>
          Dados Pessoais
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="font-semibold">Nome *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo do aluno"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-semibold">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold">Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 9999-9999"
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-semibold">CPF</Label>
              <Input
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold">Foto (URL)</Label>
              <Input
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://example.com/foto.jpg"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2: Dados Acadêmicos */}
      <div className="border-b pb-6">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">2</span>
          Dados Acadêmicos
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-semibold">ID do Portal Acadêmico</Label>
              <Input
                value={formData.academicId}
                onChange={(e) => setFormData({ ...formData, academicId: e.target.value })}
                placeholder="ID do aluno no Portal"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold">Curso</Label>
              <Input
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="Ex: Grooming Básico"
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-semibold">Turma</Label>
              <Input
                value={formData.classGroup}
                onChange={(e) => setFormData({ ...formData, classGroup: e.target.value })}
                placeholder="Ex: Turma A"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold">Status Acadêmico</Label>
              <Select value={formData.academicStatus} onValueChange={(value) => setFormData({ ...formData, academicStatus: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="graduated">Formado</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 3: Dados Operacionais */}
      <div className="border-b pb-6">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">3</span>
          Dados Operacionais
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="font-semibold">Instrutor Responsável</Label>
            <Select value={formData.instructorId} onValueChange={(value) => setFormData({ ...formData, instructorId: value })}>
              <SelectTrigger className="mt-1">
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

          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.isAuthorized}
                onCheckedChange={(checked) => setFormData({ ...formData, isAuthorized: checked })}
              />
              <Label className="font-semibold cursor-pointer">Liberado para prática</Label>
            </div>
            {!formData.isAuthorized && (
              <div className="ml-6">
                <Label className="font-semibold text-sm">Motivo do Bloqueio</Label>
                <Textarea
                  value={formData.blockReason}
                  onChange={(e) => setFormData({ ...formData, blockReason: e.target.value })}
                  placeholder="Ex: Aguardando conclusão de módulo..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div>
            <Label className="font-semibold">Nível Prático</Label>
            <Select value={formData.practiceLevel} onValueChange={(value) => setFormData({ ...formData, practiceLevel: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.needsSupervision}
                onCheckedChange={(checked) => setFormData({ ...formData, needsSupervision: checked })}
              />
              <Label className="font-semibold cursor-pointer">Precisa de supervisão</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.canWorkAlone}
                onCheckedChange={(checked) => setFormData({ ...formData, canWorkAlone: checked })}
              />
              <Label className="font-semibold cursor-pointer">Pode atender sozinho</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 4: Permissões */}
      <div className="border-b pb-6">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold">4</span>
          Permissões
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="font-semibold mb-3 block">Serviços Permitidos</Label>
            <div className="grid grid-cols-2 gap-3">
              {serviceOptions.map((service) => (
                <div key={service.value} className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                  <Checkbox
                    checked={formData.allowedServices?.includes(service.value)}
                    onCheckedChange={() => toggleService(service.value)}
                  />
                  <Label className="font-normal cursor-pointer">{service.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-semibold mb-3 block">Portes de Cães Permitidos</Label>
            <div className="grid grid-cols-2 gap-3">
              {dogSizeOptions.map((size) => (
                <div key={size.value} className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                  <Checkbox
                    checked={formData.allowedDogSizes?.includes(size.value)}
                    onCheckedChange={() => toggleDogSize(size.value)}
                  />
                  <Label className="font-normal cursor-pointer">{size.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Seção 5: Observações */}
      <div>
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold">5</span>
          Observações
        </h3>
        <div>
          <Label className="font-semibold">Observações Operacionais</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Observações sobre o aluno, restrições especiais, etc..."
            rows={3}
            className="mt-1"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Cancelar
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
