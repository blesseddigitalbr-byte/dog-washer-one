import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search, Filter, X, Upload, Camera } from "lucide-react";
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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
    petStatus: [],
    needsSupervision: true,
    canWorkAlone: false,
    allowedServices: [],
    notes: "",
  });

  // Fetch students
  const { data: students = [], isLoading, refetch } = trpc.students.list.useQuery({
    filter: filterStatus === "all" ? "all" : filterStatus === "authorized" ? "authorized" : "blocked",
  });

  // Fetch professionals (for instructor selection)
  const { data: professionals = [] } = trpc.professionals.list.useQuery();

  // Fetch services (for course and allowed services)
  const { data: services = [] } = trpc.services.list.useQuery();

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

  // Upload photo mutation
  const uploadPhotoMutation = trpc.students.uploadPhoto.useMutation({
    onSuccess: (data) => {
      toast.success("Foto enviada com sucesso!");
      setFormData({ ...formData, photoUrl: data.photoUrl });
      setPhotoFile(null);
      setPhotoPreview("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar foto");
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto deve ter no máximo 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo deve ser uma imagem (JPG, PNG, etc)");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!photoFile || !selectedStudent) return;

    setIsUploadingPhoto(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await uploadPhotoMutation.mutateAsync({
          studentId: selectedStudent.id,
          photoUrl: base64,
        });
      };
      reader.readAsDataURL(photoFile);
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

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
      needsSupervision: true,
      canWorkAlone: false,
      allowedServices: [],
      notes: "",
    });
    setPhotoFile(null);
    setPhotoPreview("");
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    createMutation.mutate({
      organizationId: "default-org",
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      cpf: formData.cpf,
      photoUrl: formData.photoUrl,
      course: formData.course,
      classGroup: formData.classGroup,
      academicStatus: formData.academicStatus,
      academicId: formData.academicId,
      instructorId: formData.instructorId,
      isAuthorized: formData.isAuthorized,
      blockReason: formData.blockReason,
      practiceLevel: formData.practiceLevel,
      needsSupervision: formData.needsSupervision,
      canWorkAlone: formData.canWorkAlone,
      allowedServices: formData.allowedServices,
      notes: formData.notes,
    });
  };

  const handleEdit = () => {
    if (!selectedStudent) return;

    updateMutation.mutate({
      id: selectedStudent.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      photoUrl: formData.photoUrl,
      course: formData.course,
      classGroup: formData.classGroup,
      academicStatus: formData.academicStatus,
      instructorId: formData.instructorId,
      isAuthorized: formData.isAuthorized,
      blockReason: formData.blockReason,
      practiceLevel: formData.practiceLevel,
      needsSupervision: formData.needsSupervision,
      canWorkAlone: formData.canWorkAlone,
      allowedServices: formData.allowedServices,
      notes: formData.notes,
    });
  };

  const openEditDialog = (student: any) => {
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
      petStatus: student.pet_status ? JSON.parse(student.pet_status) : [],
      needsSupervision: student.needs_supervision || true,
      canWorkAlone: student.can_work_alone || false,
      allowedServices: student.allowed_services ? JSON.parse(student.allowed_services) : [],
      notes: student.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const getAuthorizationBadge = (isAuthorized: boolean) => (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
      isAuthorized ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    }`}>
      {isAuthorized ? "Autorizado" : "Bloqueado"}
    </span>
  );

  const getPracticeLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-blue-100 text-blue-700",
      intermediate: "bg-yellow-100 text-yellow-700",
      advanced: "bg-purple-100 text-purple-700",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[level] || colors.beginner}`}>
        {level === "beginner" ? "Iniciante" : level === "intermediate" ? "Intermediário" : "Avançado"}
      </span>
    );
  };

  // Pagination
  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    total: students.length,
    authorized: students.filter((s: any) => s.is_authorized).length,
    blocked: students.filter((s: any) => !s.is_authorized).length,
    courses: new Set(students.map((s: any) => s.course)).size,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-blue-600" />
            Alunos
          </h1>
          <p className="text-muted-foreground">Gerencie os alunos do salão-escola</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border-l-4 border-blue-500 p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total de Alunos</p>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border-l-4 border-green-500 p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Alunos Ativos</p>
            <p className="text-3xl font-bold text-foreground">{stats.authorized}</p>
          </div>
          <div className="bg-white rounded-lg border-l-4 border-red-500 p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Bloqueados</p>
            <p className="text-3xl font-bold text-foreground">{stats.blocked}</p>
          </div>
          <div className="bg-white rounded-lg border-l-4 border-purple-500 p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Cursos</p>
            <p className="text-3xl font-bold text-foreground">{stats.courses}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex gap-4 mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
                services={services}
                photoPreview={photoPreview}
                photoFile={photoFile}
                onPhotoChange={handlePhotoChange}
                onUploadPhoto={handleUploadPhoto}
                isUploadingPhoto={isUploadingPhoto}
                onRemovePhoto={() => {
                  setPhotoFile(null);
                  setPhotoPreview("");
                }}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                  Criar Aluno
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex-1 relative">
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

          <Select value={filterStatus} onValueChange={(value) => {
            setFilterStatus(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="authorized">Autorizados</SelectItem>
              <SelectItem value="blocked">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Students List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando alunos...</p>
            </div>
          ) : paginatedStudents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Nenhum aluno encontrado</p>
            </div>
          ) : (
            paginatedStudents.map((student: any) => (
              <div key={student.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white shadow-md">
                      {student.photo_url ? (
                        <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getAuthorizationBadge(student.is_authorized)}
                    {getPracticeLevelBadge(student.practice_level)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">CURSO</p>
                    <p className="font-semibold text-foreground">{student.course || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">DATA DE INSCRIÇÃO</p>
                    <p className="font-semibold text-foreground">
                      {student.created_at ? new Date(student.created_at).toLocaleDateString("pt-BR") : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">INSTRUTOR</p>
                    <p className="font-semibold text-foreground">{student.instructor?.name || "-"}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(student)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      setSelectedStudent(student);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Aluno</DialogTitle>
            </DialogHeader>
            <StudentForm
              formData={formData}
              setFormData={setFormData}
              professionals={professionals}
              services={services}
              photoPreview={photoPreview}
              photoFile={photoFile}
              onPhotoChange={handlePhotoChange}
              onUploadPhoto={handleUploadPhoto}
              isUploadingPhoto={isUploadingPhoto}
              onRemovePhoto={() => {
                setPhotoFile(null);
                setPhotoPreview("");
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Deletar Aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar {selectedStudent?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedStudent && deleteMutation.mutate({ id: selectedStudent.id })}
                className="bg-red-600 hover:bg-red-700"
              >
                Deletar
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Student Form Component
function StudentForm({
  formData,
  setFormData,
  professionals,
  services,
  photoPreview,
  photoFile,
  onPhotoChange,
  onUploadPhoto,
  isUploadingPhoto,
  onRemovePhoto,
}: any) {
  return (
    <div className="space-y-6 py-4">
      {/* Section 1: Personal Data */}
      <div>
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
          </div>

          {/* Photo Upload */}
          <div>
            <Label className="font-semibold">Foto do Aluno</Label>
            <div className="mt-2 flex gap-3">
              <div className="flex-1">
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Camera className="w-4 h-4" />
                    <span>Clique para fazer upload</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              {photoPreview && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={onRemovePhoto}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            {photoFile && (
              <Button
                onClick={onUploadPhoto}
                disabled={isUploadingPhoto}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700"
              >
                {isUploadingPhoto ? "Enviando..." : "Enviar Foto"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Academic Data */}
      <div>
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">2</span>
          Dados Acadêmicos
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="font-semibold">ID do Portal Acadêmico</Label>
            <Input
              value={formData.academicId}
              onChange={(e) => setFormData({ ...formData, academicId: e.target.value })}
              placeholder="ID do aluno no Portal"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-semibold">Curso</Label>
              <Select value={formData.course} onValueChange={(value) => setFormData({ ...formData, course: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service: any) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold">Turma</Label>
              <Input
                value={formData.classGroup}
                onChange={(e) => setFormData({ ...formData, classGroup: e.target.value })}
                placeholder="Ex: Turma A"
                className="mt-1"
              />
            </div>
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

      {/* Section 3: Operational Data */}
      <div>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                checked={formData.isAuthorized}
                onCheckedChange={(checked) => setFormData({ ...formData, isAuthorized: checked })}
              />
              <Label className="font-semibold cursor-pointer">Liberado para Prática</Label>
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
          </div>
          {!formData.isAuthorized && (
            <div>
              <Label className="font-semibold">Motivo do Bloqueio</Label>
              <Input
                value={formData.blockReason}
                onChange={(e) => setFormData({ ...formData, blockReason: e.target.value })}
                placeholder="Ex: Documentação incompleta"
                className="mt-1"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                checked={formData.needsSupervision}
                onCheckedChange={(checked) => setFormData({ ...formData, needsSupervision: checked })}
              />
              <Label className="font-semibold cursor-pointer">Precisa de Supervisão</Label>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                checked={formData.canWorkAlone}
                onCheckedChange={(checked) => setFormData({ ...formData, canWorkAlone: checked })}
              />
              <Label className="font-semibold cursor-pointer">Pode Atender Sozinho</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Pet Status */}
      <div>
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold">4</span>
          Status do Pet Atendido
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.petStatus?.includes("VIP")}
                onCheckedChange={(checked) => {
                  const newStatus = checked
                    ? [...(formData.petStatus || []), "VIP"]
                    : (formData.petStatus || []).filter((s: string) => s !== "VIP");
                  setFormData({ ...formData, petStatus: newStatus });
                }}
              />
              <Label className="font-semibold cursor-pointer">VIP</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.petStatus?.includes("modelo")}
                onCheckedChange={(checked) => {
                  const newStatus = checked
                    ? [...(formData.petStatus || []), "modelo"]
                    : (formData.petStatus || []).filter((s: string) => s !== "modelo");
                  setFormData({ ...formData, petStatus: newStatus });
                }}
              />
              <Label className="font-semibold cursor-pointer">Cão Modelo</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Allowed Services */}
      <div>
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold">5</span>
          Serviços Permitidos
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Selecione os serviços que o aluno está autorizado a realizar</p>
          <div className="grid grid-cols-2 gap-3">
            {services.map((service: any) => (
              <div key={service.id} className="flex items-center gap-2">
                <Checkbox
                  checked={formData.allowedServices?.includes(service.id)}
                  onCheckedChange={(checked) => {
                    const newServices = checked
                      ? [...(formData.allowedServices || []), service.id]
                      : (formData.allowedServices || []).filter((s: string) => s !== service.id);
                    setFormData({ ...formData, allowedServices: newServices });
                  }}
                />
                <Label className="font-semibold cursor-pointer">{service.name}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 6: Notes */}
      <div>
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-bold">6</span>
          Observações Operacionais
        </h3>
        <div className="space-y-3">
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Adicione observações sobre o aluno..."
            className="mt-1"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}
