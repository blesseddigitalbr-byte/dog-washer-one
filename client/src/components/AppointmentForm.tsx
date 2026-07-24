import { useState, useMemo, useEffect } from "react";
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
import { X, Plus, Search, AlertCircle } from "lucide-react";

interface AppointmentFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  appointment?: any;
}

export function AppointmentForm({ onClose, onSuccess, appointment }: AppointmentFormProps) {
  // Fetch data
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: professionals = [] } = trpc.professionals.list.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();
  const { data: students = [] } = trpc.students.list.useQuery({ filter: "authorized" });

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
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [executedBy, setExecutedBy] = useState<"professional" | "student">("professional");
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentPermissions, setStudentPermissions] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState<"none" | "weekly" | "biweekly" | "monthly">("none");
  const [notes, setNotes] = useState("");
  const { data: clientPackages = [] } = trpc.clientPackages.byClient.useQuery(
    { clientId: selectedClient },
    { enabled: !!selectedClient },
  );

  // Mutations
  const createMutation = trpc.appointments.create.useMutation();
  const updateMutation = trpc.appointments.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!appointment) return;
    const date = new Date(appointment.appointmentDate || appointment.appointment_date);
    const localDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    setSelectedClient(appointment.clientId || appointment.client_id || "");
    setSelectedPet(appointment.petId || appointment.pet_id || null);
    setSelectedService(appointment.serviceId || appointment.service_id || "");
    setSelectedProfessional(appointment.professionalId || appointment.professional_id || "");
    setSelectedPackage(appointment.clientPackageId || appointment.client_package_id || "");
    setAppointmentDate(localDate);
    setStartTime(appointment.start_time?.slice(0, 5) || `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`);
    setRecurrenceRule(appointment.recurrence_rule || "none");
    setNotes(appointment.notes || "");
  }, [appointment]);

  // Validate student permissions
  const validatePermissionsMutation = trpc.students.validatePermissions.useQuery(
    selectedStudent && executedBy === "student" ? { studentId: selectedStudent } : { studentId: "" },
    { enabled: !!selectedStudent && executedBy === "student" }
  );

  // Update student permissions when validation result changes
  useEffect(() => {
    if (validatePermissionsMutation.data) {
      setStudentPermissions(validatePermissionsMutation.data);
      if (!validatePermissionsMutation.data.valid) {
        toast.error(validatePermissionsMutation.data.reason);
      }
    }
  }, [validatePermissionsMutation.data]);

  // Get pets for selected client
  const clientPets = useMemo(() => {
    if (!selectedClient) return [];
    const client = clients.find((c: any) => c.id === selectedClient);
    return client?.pets || [];
  }, [selectedClient, clients]);

  // Filtrar clientes por termo de busca
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clients;
    return clients.filter((client: any) =>
      (client?.name || "").toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [clients, clientSearchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!selectedClient) {
      toast.error("Selecione um cliente");
      return;
    }
    if (!selectedPet) {
      toast.error("Selecione um pet");
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
    if (executedBy === "student" && studentPermissions && !studentPermissions.valid) {
      toast.error(studentPermissions.reason);
      return;
    }

    try {
      const startsAt = new Date(`${appointmentDate}T${startTime}:00`);
      if (Number.isNaN(startsAt.getTime())) {
        toast.error("Data ou horário inválido");
        return;
      }
      const professionalId =
        executedBy === "professional"
          ? selectedProfessional
          : studentPermissions?.student?.instructor_id;
      if (!professionalId) {
        toast.error("O aluno precisa ter um supervisor vinculado");
        return;
      }

      const appointmentPayload = {
        clientId: selectedClient,
        petId: selectedPet,
        serviceId: selectedService,
        professionalId,
        clientPackageId: selectedPackage && selectedPackage !== "none" ? selectedPackage : undefined,
        appointmentDate: startsAt.toISOString(),
        recurrenceRule,
        notes,
        sendEmail: true,
      };

      if (appointment?.id) {
        await updateMutation.mutateAsync({
          id: appointment.id,
          ...appointmentPayload,
          clientPackageId: appointmentPayload.clientPackageId || null,
        });
      } else {
        await createMutation.mutateAsync(appointmentPayload);
      }

      // Se foi um aluno, registrar na tabela appointment_students
      if (executedBy === "student" && selectedStudent) {
        console.log("Aluno vinculado ao agendamento:", selectedStudent);
      }

      toast.success(appointment?.id ? "Agendamento atualizado com sucesso!" : "Agendamento criado com sucesso!");
      await utils.appointments.list.invalidate();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar agendamento");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Cliente */}
      <div>
        <Label htmlFor="client" className="text-base font-semibold">
          Cliente *
        </Label>
        <div className="space-y-2">
          <Input
            placeholder="Buscar cliente por nome..."
            value={clientSearchTerm}
            onChange={(e) => setClientSearchTerm(e.target.value)}
            className="mt-2"
          />
          <Select value={selectedClient} onValueChange={(value) => {
            setSelectedClient(value);
            setClientSearchTerm("");
            setSelectedPet(null);
          }}>
            <SelectTrigger id="client" className="mt-2">
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {filteredClients.map((client: any) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pets */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          Pet *
        </Label>
        <div className="space-y-3">
          {selectedPet && (
            <div className="space-y-2 mb-3">
              <div
                className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200"
              >
                <span className="font-medium text-foreground">
                  {allPets.find((p) => p.id === selectedPet)?.displayName || 
                   `${allPets.find((p) => p.id === selectedPet)?.name} (Tutor: ${allPets.find((p) => p.id === selectedPet)?.clientName})`}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPet(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {!selectedPet && (
            <Select value="" onValueChange={(value) => {
              if (value) {
                setSelectedPet(value);
              }
            }}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione o pet" />
              </SelectTrigger>
              <SelectContent>
                {clientPets.map((pet: any) => (
                  <SelectItem
                    key={pet.id}
                    value={pet.id}
                  >
                    {pet.name} {pet.clientName ? `- ${pet.clientName}` : ""}
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
            <SelectItem value="none">Sem pacote</SelectItem>
            {clientPackages.filter((pkg: any) => !selectedPet || pkg.pet_id === selectedPet).map((pkg: any) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {pkg.plan?.name || pkg.code} — saldo {pkg.balance_baths} banho(s), {pkg.balance_groomings} tosa(s)
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
        <RadioGroup value={executedBy} onValueChange={(value: any) => {
          setExecutedBy(value);
          setSelectedStudent("");
          setStudentPermissions(null);
        }}>
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

        {/* Profissional ou Aluno Responsável */}
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
                professionals.filter((prof: any) => prof.is_active).map((prof: any) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))
              ) : (
                students.map((student: any) => (
                  <SelectItem key={student.id} value={student.id}>
                    <div className="flex items-center gap-2">
                      <span>{student.name}</span>
                      {student.is_authorized ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Autorizado</span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Bloqueado</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Student Permissions Info */}
          {executedBy === "student" && selectedStudent && studentPermissions && (
            <div className={`mt-3 p-3 rounded-lg border ${
              studentPermissions.valid 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            }`}>
              {studentPermissions.valid ? (
                <>
                  <p className="text-sm font-semibold text-green-900 mb-2">✓ Aluno autorizado para prática</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-green-700">Nível Prático:</p>
                      <p className="font-medium text-foreground capitalize">{studentPermissions.student?.practice_level}</p>
                    </div>
                    <div>
                      <p className="text-green-700">Supervisão:</p>
                      <p className="font-medium text-foreground">{studentPermissions.needsSupervision ? "Necessária" : "Não necessária"}</p>
                    </div>
                  </div>
                  {studentPermissions.student?.notes && (
                    <div className="mt-2 text-xs text-green-700">
                      <strong>Observações:</strong> {studentPermissions.student.notes}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Aluno não autorizado</p>
                    <p className="text-xs text-red-700 mt-1">{studentPermissions.reason}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading state */}
          {executedBy === "student" && selectedStudent && validatePermissionsMutation.isLoading && (
            <div className="mt-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">Validando permissões do aluno...</p>
            </div>
          )}
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

      <div className="lg:col-span-2">
        <Label htmlFor="recurrence" className="text-base font-semibold">
          Recorrência
        </Label>
        <Select value={recurrenceRule} onValueChange={(value: typeof recurrenceRule) => setRecurrenceRule(value)}>
          <SelectTrigger id="recurrence" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Não se repete</SelectItem>
            <SelectItem value="weekly">Toda semana</SelectItem>
            <SelectItem value="biweekly">A cada 15 dias</SelectItem>
            <SelectItem value="monthly">Todo mês</SelectItem>
          </SelectContent>
        </Select>
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
      <div className="sticky bottom-0 z-10 flex gap-3 justify-end border-t bg-background py-4 lg:col-span-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold"
          disabled={createMutation.isPending || updateMutation.isPending || (executedBy === "student" && validatePermissionsMutation.isLoading)}
        >
          {createMutation.isPending || updateMutation.isPending
            ? "Salvando..."
            : appointment?.id ? "Salvar Alterações" : "Criar Agendamento"}
        </Button>
      </div>
    </form>
  );
}
