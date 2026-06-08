import { useState, useEffect } from "react";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X } from "lucide-react";

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
  const [formData, setFormData] = useState({
    clientId: "",
    petId: "",
    serviceId: "",
    professionalId: "",
    appointmentDate: "",
    startTime: "",
    durationMinutes: "",
    status: "pending",
    notes: "",
  });

  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedPets, setSelectedPets] = useState<any[]>([]);

  // Fetch data
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: professionals = [] } = trpc.professionals.list.useQuery();
  
  // Mock services - será substituído por router real
  const services = [
    { id: "1", name: "Banho e Tosa", price: 80 },
    { id: "2", name: "Banho", price: 50 },
    { id: "3", name: "Tosa", price: 60 },
  ];
  const { data: appointment } = trpc.appointments.getById.useQuery(
    { id: appointmentId! },
    { enabled: !!appointmentId }
  );

  // Mutations
  const createMutation = trpc.appointments.create.useMutation();
  const updateMutation = trpc.appointments.update.useMutation();
  const utils = trpc.useUtils();

  // Load appointment data if editing
  useEffect(() => {
    if (appointment) {
      setFormData({
        clientId: appointment.client_id || "",
        petId: appointment.pet_id || "",
        serviceId: appointment.service_id || "",
        professionalId: appointment.professional_id || "",
        appointmentDate: appointment.appointment_date?.split("T")[0] || "",
        startTime: appointment.start_time || "",
        durationMinutes: appointment.duration_minutes || "",
        status: appointment.status || "pending",
        notes: appointment.notes || "",
      });
    }
  }, [appointment]);

  // Update pets when client changes
  useEffect(() => {
    const client = clients.find((c: any) => c.id === formData.clientId);
    setSelectedClient(client);
    if (client?.pets) {
      setSelectedPets(client.pets);
    }
  }, [formData.clientId, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.clientId ||
      !formData.petId ||
      !formData.serviceId ||
      !formData.professionalId ||
      !formData.appointmentDate
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const appointmentDateTime = `${formData.appointmentDate}T${formData.startTime || "09:00"}:00`;

      if (appointmentId) {
        await updateMutation.mutateAsync({
          id: appointmentId,
          clientId: formData.clientId,
          petId: formData.petId,
          serviceId: formData.serviceId,
          professionalId: formData.professionalId,
          appointmentDate: appointmentDateTime,
          startTime: formData.startTime,
          durationMinutes: formData.durationMinutes
            ? parseInt(formData.durationMinutes)
            : undefined,
          status: formData.status,
          notes: formData.notes,
        });
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        // Usar organizationId e unitId do cliente ou do usuário
        const org = selectedClient?.organization_id || "default-org";
        const unit = selectedClient?.unit_id || "default-unit";
        
        await createMutation.mutateAsync({
          organizationId: org,
          unitId: unit,
          clientId: formData.clientId,
          petId: formData.petId,
          serviceId: formData.serviceId,
          professionalId: formData.professionalId,
          appointmentDate: appointmentDateTime,
          startTime: formData.startTime,
          durationMinutes: formData.durationMinutes
            ? parseInt(formData.durationMinutes)
            : undefined,
          status: formData.status,
          notes: formData.notes,
        });
        toast.success("Agendamento criado com sucesso!");
      }

      await utils.appointments.list.invalidate();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("Erro ao salvar agendamento");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {appointmentId ? "Editar Agendamento" : "Novo Agendamento"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Row 1: Client and Pet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client" className="text-xs font-bold uppercase tracking-wider">
                Cliente *
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value, petId: "" })
                }
              >
                <SelectTrigger className="rounded-lg border border-border">
                  <SelectValue placeholder="Selecione um cliente" />
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

            <div>
              <Label htmlFor="pet" className="text-xs font-bold uppercase tracking-wider">
                Pet *
              </Label>
              <Select
                value={formData.petId}
                onValueChange={(value) =>
                  setFormData({ ...formData, petId: value })
                }
              >
                <SelectTrigger className="rounded-lg border border-border">
                  <SelectValue placeholder="Selecione um pet" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPets.map((pet: any) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.breed})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Service and Professional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service" className="text-xs font-bold uppercase tracking-wider">
                Serviço *
              </Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) =>
                  setFormData({ ...formData, serviceId: value })
                }
              >
                <SelectTrigger className="rounded-lg border border-border">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service: any) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - R$ {service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="professional" className="text-xs font-bold uppercase tracking-wider">
                Profissional *
              </Label>
              <Select
                value={formData.professionalId}
                onValueChange={(value) =>
                  setFormData({ ...formData, professionalId: value })
                }
              >
                <SelectTrigger className="rounded-lg border border-border">
                  <SelectValue placeholder="Selecione um profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((prof: any) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                      {prof.specialization && ` - ${prof.specialization}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider">
                Data *
              </Label>
              <Input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentDate: e.target.value })
                }
                className="rounded-lg border border-border"
              />
            </div>

            <div>
              <Label htmlFor="time" className="text-xs font-bold uppercase tracking-wider">
                Horário
              </Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="rounded-lg border border-border"
              />
            </div>
          </div>

          {/* Row 4: Duration and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration" className="text-xs font-bold uppercase tracking-wider">
                Duração (minutos)
              </Label>
              <Input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: e.target.value })
                }
                className="rounded-lg border border-border"
                placeholder="60"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="rounded-lg border border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider">
              Observações
            </Label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full rounded-lg border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              rows={3}
              placeholder="Adicione observações sobre o agendamento..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-wide rounded-2xl"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : appointmentId
                ? "Atualizar"
                : "Criar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
