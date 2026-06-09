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

interface AppointmentFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AppointmentForm({ onClose, onSuccess }: AppointmentFormProps) {
  // Fetch data
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: professionals = [] } = trpc.professionals.list.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();
  const { data: packages = [] } = trpc.packages.list.useQuery();

  // Mock students
  const students = [
    { id: "550e8400-e29b-41d4-a716-446655440020", name: "Aluno 1" },
    { id: "550e8400-e29b-41d4-a716-446655440021", name: "Aluno 2" },
    { id: "550e8400-e29b-41d4-a716-446655440022", name: "Aluno 3" },
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
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [petSelectValue, setPetSelectValue] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [executedBy, setExecutedBy] = useState<"professional" | "student">("professional");
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");

  // Mutations
  const createMutation = trpc.appointments.create.useMutation();
  const utils = trpc.useUtils();

  // Get pets for selected client
  const clientPets = useMemo(() => {
    if (!selectedClient) return [];
    const client = clients.find((c: any) => c.id === selectedClient);
    return client?.pets || [];
  }, [selectedClient, clients]);

  const handleAddPet = () => {
    if (!selectedClient) {
      toast.error("Selecione um cliente primeiro");
      return;
    }
    if (selectedPets.length >= 8) {
      toast.error("Máximo de 8 pets por agendamento");
      return;
    }
    // Aqui você poderia abrir um modal para selecionar o pet
    // Por enquanto, apenas mostramos a lista
  };

  const handleRemovePet = (petId: string) => {
    setSelectedPets(selectedPets.filter((id) => id !== petId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!selectedClient) {
      toast.error("Selecione um cliente");
      return;
    }
    if (selectedPets.length === 0) {
      toast.error("Selecione pelo menos um pet");
      return;
    }
    if (!selectedService) {
      toast.error("Selecione um serviço");
      return;
    }
    if (!appointmentDate) {
      toast.error("Selecione uma data");
      return;
    }
    if (!startTime) {
      toast.error("Selecione um horário");
      return;
    }
    if (executedBy === "professional" && !selectedProfessional) {
      toast.error("Selecione um profissional");
      return;
    }
    if (executedBy === "student" && !selectedStudent) {
      toast.error("Selecione um aluno");
      return;
    }

    try {
      // Criar um agendamento para cada pet
      for (const petId of selectedPets) {
        const appointmentPayload = {
          organizationId: "550e8400-e29b-41d4-a716-446655440000",
          unitId: "550e8400-e29b-41d4-a716-446655440001",
          clientId: selectedClient,
          petId,
          serviceId: selectedService,
          professionalId:
            executedBy === "professional"
              ? selectedProfessional
              : "550e8400-e29b-41d4-a716-446655440002",
          appointmentDate: new Date(appointmentDate).toISOString(),
          startTime,
          durationMinutes: 60,
          status: "pending",
          notes,
        };

        await createMutation.mutateAsync(appointmentPayload);
      }

      toast.success("Agendamento(s) criado(s) com sucesso!");
      await utils.appointments.list.invalidate();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao criar agendamentos:", error);
      toast.error("Erro ao criar agendamentos");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cliente */}
      <div>
        <Label htmlFor="client" className="text-base font-semibold">
          Cliente *
        </Label>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger id="client" className="mt-2">
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client: any) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pets */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          Pet *
        </Label>
        <div className="space-y-3">
          {selectedPets.length > 0 && (
            <div className="space-y-2 mb-3">
              {selectedPets.map((petId) => {
                const pet = allPets.find((p) => p.id === petId);
                return (
                  <div
                    key={petId}
                    className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200"
                  >
                    <span className="font-medium text-foreground">
                      {pet?.displayName || `${pet?.name} (Tutor: ${pet?.clientName})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePet(petId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {selectedPets.length < 8 && (
            <Select value={petSelectValue} onValueChange={(value) => {
              if (value && !selectedPets.includes(value)) {
                setSelectedPets([...selectedPets, value]);
                setPetSelectValue("");
              }
            }}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione o pet" />
              </SelectTrigger>
              <SelectContent>
                {allPets
                  .filter((pet) => !selectedPets.includes(pet.id))
                  .map((pet) => (
                    <SelectItem
                      key={pet.id}
                      value={pet.id}
                    >
                      {pet.displayName || `${pet.name} (Tutor: ${pet.clientName})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Serviço */}
      <div>
        <Label htmlFor="service" className="text-base font-semibold">
          Serviço *
        </Label>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger id="service" className="mt-2">
            <SelectValue placeholder="Selecione o serviço" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service: any) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} - R$ {parseFloat(service.price || 0).toFixed(2)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Plano (Opcional) */}
      <div>
        <Label htmlFor="package" className="text-base font-semibold">
          Plano (Opcional)
        </Label>
        <Select value={selectedPackage} onValueChange={setSelectedPackage}>
          <SelectTrigger id="package" className="mt-2">
            <SelectValue placeholder="Selecione um plano ou deixe em branco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sem plano</SelectItem>
            {packages.map((pkg: any) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {pkg.name} - {pkg.total_baths} banhos, {pkg.total_groomings} tosas
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Executado por */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <Label className="text-base font-semibold mb-3 block">
          Executado por
        </Label>
        <RadioGroup value={executedBy} onValueChange={(value: any) => setExecutedBy(value)}>
          <div className="flex items-center space-x-3 mb-3">
            <RadioGroupItem value="professional" id="exec-prof" />
            <Label htmlFor="exec-prof" className="font-normal cursor-pointer">
              Profissional
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="student" id="exec-student" />
            <Label htmlFor="exec-student" className="font-normal cursor-pointer">
              Aluno (Salão-Escola)
            </Label>
          </div>
        </RadioGroup>

        {/* Profissional Responsável */}
        <div className="mt-4">
          <Label htmlFor="professional" className="text-sm font-semibold">
            {executedBy === "professional" ? "Profissional" : "Aluno"} Responsável *
          </Label>
          <Select
            value={
              executedBy === "professional" ? selectedProfessional : selectedStudent
            }
            onValueChange={(value) => {
              if (executedBy === "professional") {
                setSelectedProfessional(value);
              } else {
                setSelectedStudent(value);
              }
            }}
          >
            <SelectTrigger id="professional" className="mt-2">
              <SelectValue
                placeholder={`Selecione o ${
                  executedBy === "professional" ? "profissional" : "aluno"
                }`}
              />
            </SelectTrigger>
            <SelectContent>
              {executedBy === "professional" ? (
                professionals.map((prof: any) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))
              ) : (
                students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data e Hora */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date" className="text-base font-semibold">
            Data *
          </Label>
          <Input
            id="date"
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            className="mt-2"
            required
          />
        </div>
        <div>
          <Label htmlFor="time" className="text-base font-semibold">
            Horário *
          </Label>
          <Input
            id="time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-2"
            required
          />
        </div>
      </div>

      {/* Observações */}
      <div>
        <Label htmlFor="notes" className="text-base font-semibold">
          Observações Operacionais
        </Label>
        <Textarea
          id="notes"
          placeholder="Observações sobre o atendimento..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-2"
        />
      </div>

      {/* Botões */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Criando..." : "Criar Agendamento"}
        </Button>
      </div>
    </form>
  );
}
