import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader } from "lucide-react";
import { StudentStats } from "@/components/StudentStats";
import { StudentCard } from "@/components/StudentCard";
import { StudentForm } from "@/components/StudentForm";

export default function Students() {
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    photoUrl: "",
    academicPortalId: "",
    course: "",
    classGroup: "",
    academicStatus: "active",
    instructorId: "",
    isAuthorized: false,
    blockReason: "",
    practiceLevel: "",
    needsSupervisión: false,
    canWorkAlone: false,
    allowedServices: [],
    allowedDogSizes: [],
    petStatus: [],
    notes: "",
  });

  // Queries
  const { data: students = [], isLoading, refetch } = trpc.students.list.useQuery();
  const { data: professionals = [] } = trpc.professionals.list.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();

  // Mutations
  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      toast.success("Aluno criado com sucesso!");
      refetch();
      setOpenDialog(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar aluno");
    },
  });

  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      toast.success("Aluno atualizado com sucesso!");
      refetch();
      setOpenDialog(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao atualizar aluno");
    },
  });

  const deleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success("Aluno deletado com sucesso!");
      refetch();
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erro ao deletar aluno");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      photoUrl: "",
      academicPortalId: "",
      course: "",
      classGroup: "",
      academicStatus: "active",
      instructorId: "",
      isAuthorized: false,
      blockReason: "",
      practiceLevel: "",
      needsSupervisión: false,
      canWorkAlone: false,
      allowedServices: [],
      allowedDogSizes: [],
      petStatus: [],
      notes: "",
    });
    setIsEditMode(false);
    setSelectedStudent(null);
  };

  const handleOpenDialog = (student?: any) => {
    if (student) {
      setIsEditMode(true);
      setSelectedStudent(student);
      setFormData({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        cpf: student.cpf || "",
        photoUrl: student.photo_url || "",
        academicPortalId: student.academic_portal_id || "",
        course: student.course || "",
        classGroup: student.class_group || "",
        academicStatus: student.academic_status || "active",
        instructorId: student.instructor_id || "",
        isAuthorized: student.is_authorized || false,
        blockReason: student.block_reason || "",
        practiceLevel: student.practice_level || "",
        needsSupervisión: student.needs_supervision || false,
        canWorkAlone: student.can_work_alone || false,
        allowedServices: student.allowed_services || [],
        allowedDogSizes: student.allowed_dog_sizes || [],
        petStatus: student.pet_status || [],
        notes: student.notes || "",
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      const payload = {
        organizationId: undefined, // Servidor pega a primeira organization
        unitId: undefined, // Servidor pega a primeira unit
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        course: formData.course || undefined,
        classGroup: formData.classGroup || undefined,
        academicStatus: formData.academicStatus,
        instructorId: formData.instructorId || undefined,
        isAuthorized: formData.isAuthorized,
        enrollmentDate: new Date().toISOString(),
      };

      if (isEditMode && selectedStudent) {
        const { organizationId, unitId, ...updatePayload } = payload;
        await updateMutation.mutateAsync({
          id: selectedStudent.id,
          ...updatePayload,
        });
      } else {
        // Remove undefined values before sending
        const cleanPayload = Object.fromEntries(
          Object.entries(payload).filter(([, v]) => v !== undefined)
        );
        await createMutation.mutateAsync(cleanPayload as any);
      }
    } catch (error) {
      console.error("Erro ao salvar aluno:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
    } catch (error) {
      console.error("Erro ao deletar aluno:", error);
    }
  };

  // Filter students
  const filteredStudents = students.filter((student: any) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === "authorized") return matchesSearch && student.is_authorized;
    if (filterStatus === "blocked") return matchesSearch && !student.is_authorized;
    return matchesSearch;
  });

  const stats = {
    total: students.length,
    active: students.filter((s: any) => s.is_authorized).length,
    courses: new Set(students.map((s: any) => s.course)).size,
  };

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Alunos</h1>
          <p className="text-gray-600 mt-2">Gerencie os alunos do salão-escola</p>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              + Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Editar Aluno" : "Novo Aluno"}
              </DialogTitle>
            </DialogHeader>

            <StudentForm
              isEditMode={isEditMode}
              formData={formData}
              professionals={professionals}
              services={services}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onSubmit={handleSubmit}
              onChange={handleFormChange}
              onCancel={() => setOpenDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <StudentStats total={stats.total} active={stats.active} courses={stats.courses} />

      {/* Search and Filter */}
      <div className="flex gap-2 flex-col">
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        
        {/* Status Filters */}
        <div className="flex gap-3 flex-wrap">
          {[
            { id: "all", label: "Todos", icon: "∞" },
            { id: "authorized", label: "Autorizados", icon: "✓" },
            { id: "blocked", label: "Bloqueados", icon: "⚠" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 border ${
                filterStatus === f.id
                  ? "bg-secondary text-foreground border-secondary shadow-sm"
                  : "bg-white text-foreground border-border hover:border-secondary/30 hover:shadow-sm"
              }`}
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                filterStatus === f.id
                  ? "bg-foreground/20 text-foreground"
                  : "bg-secondary/10 text-secondary"
              }`}>
                {f.icon}
              </span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length > 0 && (
        <div className="grid grid-cols-12 gap-8 px-6 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="col-span-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">Nome / Email</p>
          </div>
          <div className="col-span-3">
            <p className="text-xs font-semibold text-gray-600 uppercase">Curso</p>
          </div>
          <div className="col-span-3">
            <p className="text-xs font-semibold text-gray-600 uppercase">Turma</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">Status</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">Acoes</p>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card className="rounded-[16px]">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-gray-600">
                {students.length === 0 ? "Nenhum aluno cadastrado" : "Nenhum aluno encontrado"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student: any) => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={handleOpenDialog}
              onDelete={(id) => setDeleteId(id)}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este aluno? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
