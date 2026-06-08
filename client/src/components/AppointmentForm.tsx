import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

interface PetAssignment {
  petId: string;
  petName: string;
  clientName: string;
  executedBy: "professional" | "student";
  professionalId?: string;
  studentId?: string;
}

interface AppointmentFormProps {
  appointmentId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AppointmentForm({
  appointmentId,
  onClose,
  onSuccess,
}: AppointmentFormProps) {
  // Fetch data PRIMEIRO
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: professionals = [] } = trpc.professionals.list.useQuery();

  // Mock students
  const students = [
    { id: "1", name: "Aluno 1" },
    { id: "2", name: "Aluno 2" },
    { id: "3", name: "Aluno 3" },
  ];

  // Mock services
  const services = [
    { id: "1", name: "Banho e Tosa", price: 80 },
    { id: "2", name: "Banho", price: 50 },
    { id: "3", name: "Tosa", price: 60 },
    { id: "4", name: "Hidratação", price: 40 },
    { id: "5", name: "Tosa Higiênica", price: 35 },
  ];

  // Memoizar lista de pets
  const allPets = useMemo(() => {
    return clients.flatMap((client: any) =>
      (client.pets || []).map((pet: any) => ({
        ...pet,
        clientName: client.name,
        clientId: client.id,
      }))
    );
  }, [clients]);

  // State
  const [formData, setFormData] = useState({
    serviceId: "",
    appointmentDate: "",
    startTime: "",
    durationMinutes: "60",
    notes: "",
  });

  const [petAssignments, setPetAssignments] = useState<PetAssignment[]>([]);
  const [currentPetSelection, setCurrentPetSelection] = useState({
    petId: "",
    executedBy: "professional" as "professional" | "student",
    professionalId: "",
    studentId: "",
  });

  // Mutations
  const createMutation = trpc.appointments.create.useMutation();
  const utils = trpc.useUtils();

  const handleAddPetAssignment = () => {
    if (!currentPetSelection.petId) {
      toast.error("Selecione um pet");
      return;
    }

    if (
      currentPetSelection.executedBy === "professional" &&
      !currentPetSelection.professionalId
    ) {
      toast.error("Selecione um profissional");
      return;
    }

    if (
      currentPetSelection.executedBy === "student" &&
      !currentPetSelection.studentId
    ) {
      toast.error("Selecione um aluno");
      return;
    }

    if (petAssignments.length >= 8) {
      toast.error("Máximo de 8 pets por horário");
      return;
    }

    if (petAssignments.some((p) => p.petId === currentPetSelection.petId)) {
      toast.error("Este pet já foi adicionado");
      return;
    }

    const pet = allPets.find((p) => p.id === currentPetSelection.petId);
    if (!pet) {
      toast.error("Pet não encontrado");
      return;
    }

    const newAssignment: PetAssignment = {
      petId: currentPetSelection.petId,
      petName: pet.name,
      clientName: pet.clientName,
      executedBy: currentPetSelection.executedBy,
      professionalId:
        currentPetSelection.executedBy === "professional"
          ? currentPetSelection.professionalId
          : undefined,
      studentId:
        currentPetSelection.executedBy === "student"
          ? currentPetSelection.studentId
          : undefined,
    };

    setPetAssignments([...petAssignments, newAssignment]);
    setCurrentPetSelection({
      petId: "",
      executedBy: "professional",
      professionalId: "",
      studentId: "",
    });

    toast.success("Pet adicionado!");
  };

  const handleRemovePetAssignment = (petId: string) => {
    setPetAssignments(petAssignments.filter((p) => p.petId !== petId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.serviceId) {
      toast.error("Selecione um serviço");
      return;
    }
    if (!formData.appointmentDate) {
      toast.error("Selecione uma data");
      return;
    }
    if (!formData.startTime) {
      toast.error("Selecione uma hora");
      return;
    }
    if (petAssignments.length === 0) {
      toast.error("Adicione pelo menos 1 pet");
      return;
    }

    try {
      for (const assignment of petAssignments) {
        const clientId =
          allPets.find((p) => p.id === assignment.petId)?.clientId || "";
        const professionalId =
          assignment.executedBy === "professional" && assignment.professionalId
            ? assignment.professionalId
            : "550e8400-e29b-41d4-a716-446655440002";

        const appointmentPayload = {
          organizationId: "550e8400-e29b-41d4-a716-446655440000",
          unitId: "550e8400-e29b-41d4-a716-446655440001",
          clientId,
          petId: assignment.petId,
          serviceId: formData.serviceId,
          professionalId,
          appointmentDate: new Date(formData.appointmentDate).toISOString(),
          startTime: formData.startTime,
          durationMinutes: parseInt(formData.durationMinutes),
          status: "pending",
          notes: formData.notes,
        };

        await createMutation.mutateAsync(appointmentPayload);
      }

      toast.success("Agendamentos criados com sucesso!");
      await utils.appointments.list.invalidate();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao criar agendamentos:", error);
      toast.error("Erro ao criar agendamentos");
    }
  };

  const getExecutorName = (assignment: PetAssignment) => {
    if (assignment.executedBy === "professional") {
      return professionals.find((p: any) => p.id === assignment.professionalId)
        ?.name;
    } else {
      return students.find((s: any) => s.id === assignment.studentId)?.name;
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Serviço */}
        <div>
          <Label htmlFor="service">Serviços *</Label>
          <Select
            value={formData.serviceId}
            onValueChange={(value) =>
              setFormData({ ...formData, serviceId: value })
            }
          >
            <SelectTrigger id="service">
              <SelectValue placeholder="Selecione o serviço" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} - R$ {service.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data e Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={formData.appointmentDate}
              onChange={(e) =>
                setFormData({ ...formData, appointmentDate: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="time">Horário *</Label>
            <Input
              id="time"
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              required
            />
          </div>
        </div>

        {/* Duração */}
        <div>
          <Label htmlFor="duration">Duração (minutos)</Label>
          <Select
            value={formData.durationMinutes}
            onValueChange={(value) =>
              setFormData({ ...formData, durationMinutes: value })
            }
          >
            <SelectTrigger id="duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="90">1h 30min</SelectItem>
              <SelectItem value="120">2 horas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seleção de Pets */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">
              Adicionar Pets ({petAssignments.length}/8) *
            </Label>
          </div>

          {/* Pets já adicionados */}
          {petAssignments.length > 0 && (
            <div className="space-y-2">
              {petAssignments.map((assignment) => (
                <div
                  key={assignment.petId}
                  className="flex items-center justify-between bg-white p-3 rounded border border-blue-200"
                >
                  <div className="text-sm">
                    <p className="font-medium">{assignment.petName}</p>
                    <p className="text-gray-600">
                      {assignment.clientName} •{" "}
                      {assignment.executedBy === "professional"
                        ? "Profissional"
                        : "Aluno"}{" "}
                      - {getExecutorName(assignment)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePetAssignment(assignment.petId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar novo pet */}
          {petAssignments.length < 8 && (
            <div className="space-y-3 pt-3 border-t border-blue-200">
              <p className="text-sm font-medium text-gray-700">
                Adicionar novo pet
              </p>

              {/* Seleção de Pet */}
              <div>
                <Label htmlFor="pet-select" className="text-sm">
                  Pet
                </Label>
                <Select
                  value={currentPetSelection.petId}
                  onValueChange={(value) =>
                    setCurrentPetSelection({
                      ...currentPetSelection,
                      petId: value,
                    })
                  }
                >
                  <SelectTrigger id="pet-select">
                    <SelectValue placeholder="Selecione o pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPets
                      .filter(
                        (pet) =>
                          !petAssignments.some((p) => p.petId === pet.id)
                      )
                      .map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} - {pet.clientName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Executado por */}
              <div>
                <Label className="text-sm font-medium">Executado por</Label>
                <RadioGroup
                  value={currentPetSelection.executedBy}
                  onValueChange={(value: any) =>
                    setCurrentPetSelection({
                      ...currentPetSelection,
                      executedBy: value,
                      professionalId: "",
                      studentId: "",
                    })
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="professional"
                      id="exec-professional"
                    />
                    <Label
                      htmlFor="exec-professional"
                      className="font-normal cursor-pointer text-sm"
                    >
                      Profissional
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="exec-student" />
                    <Label
                      htmlFor="exec-student"
                      className="font-normal cursor-pointer text-sm"
                    >
                      Aluno (Salão-Escola)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Profissional ou Aluno */}
              {currentPetSelection.executedBy === "professional" ? (
                <div>
                  <Label htmlFor="prof-select" className="text-sm">
                    Profissional
                  </Label>
                  <Select
                    value={currentPetSelection.professionalId}
                    onValueChange={(value) =>
                      setCurrentPetSelection({
                        ...currentPetSelection,
                        professionalId: value,
                      })
                    }
                  >
                    <SelectTrigger id="prof-select">
                      <SelectValue placeholder="Selecione o profissional" />
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
              ) : (
                <div>
                  <Label htmlFor="student-select" className="text-sm">
                    Aluno
                  </Label>
                  <Select
                    value={currentPetSelection.studentId}
                    onValueChange={(value) =>
                      setCurrentPetSelection({
                        ...currentPetSelection,
                        studentId: value,
                      })
                    }
                  >
                    <SelectTrigger id="student-select">
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student: any) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Botão Adicionar */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddPetAssignment}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Adicionar Pet
              </Button>
            </div>
          )}
        </div>

        {/* Observações */}
        <div>
          <Label htmlFor="notes">Observações Operacionais</Label>
          <Textarea
            id="notes"
            placeholder="Observações sobre o atendimento..."
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={4}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending
              ? "Criando..."
              : "Criar Agendamento"}
          </Button>
        </div>
      </form>
    </div>
  );
}
