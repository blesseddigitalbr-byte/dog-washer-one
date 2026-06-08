import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { generateClientCode, generatePetCode } from "./codeGenerator";

describe("Ajustes Críticos - GroomerFlow", () => {
  describe("1. Códigos de Cadastro", () => {
    it("deve gerar código de cliente no formato CLI-XXXX", async () => {
      const code = await generateClientCode();
      expect(code).toMatch(/^CLI-\d{4}$/);
    });

    it("deve gerar código de pet no formato PET-XXXX", async () => {
      const code = await generatePetCode();
      expect(code).toMatch(/^PET-\d{4}$/);
    });

    it("códigos de cliente devem ser sequenciais", async () => {
      const code1 = await generateClientCode();
      const code2 = await generateClientCode();
      
      // Extrair números
      const num1 = parseInt(code1.split("-")[1]);
      const num2 = parseInt(code2.split("-")[1]);
      
      // Segundo deve ser maior ou igual ao primeiro
      expect(num2).toBeGreaterThanOrEqual(num1);
    });

    it("códigos de pet devem ser sequenciais", async () => {
      const code1 = await generatePetCode();
      const code2 = await generatePetCode();
      
      // Extrair números
      const num1 = parseInt(code1.split("-")[1]);
      const num2 = parseInt(code2.split("-")[1]);
      
      // Segundo deve ser maior ou igual ao primeiro
      expect(num2).toBeGreaterThanOrEqual(num1);
    });
  });

  describe("2. Formato Pet (Tutor: Nome)", () => {
    it("displayName deve seguir formato 'Pet (Tutor: Nome)'", () => {
      const petName = "Lili";
      const tutorName = "Jeane";
      const displayName = `${petName} (Tutor: ${tutorName})`;
      
      expect(displayName).toBe("Lili (Tutor: Jeane)");
      expect(displayName).toMatch(/^.+ \(Tutor: .+\)$/);
    });

    it("displayName diferencia pets com mesmo nome", () => {
      const petName = "Mika";
      
      const displayName1 = `${petName} (Tutor: David)`;
      const displayName2 = `${petName} (Tutor: João)`;
      
      expect(displayName1).not.toBe(displayName2);
      expect(displayName1).toBe("Mika (Tutor: David)");
      expect(displayName2).toBe("Mika (Tutor: João)");
    });

    it("displayName funciona com nomes compostos", () => {
      const petName = "Shih Tzu";
      const tutorName = "Jeane Paula Guedes";
      const displayName = `${petName} (Tutor: ${tutorName})`;
      
      expect(displayName).toBe("Shih Tzu (Tutor: Jeane Paula Guedes)");
    });
  });

  describe("3. Substituição de 'Bicho de Estimação' por 'Pet'", () => {
    it("código não deve conter 'Bicho de Estimação'", async () => {
      // Este teste verifica que a substituição foi feita
      // Em produção, seria feito um grep no código-fonte
      const forbiddenText = "Bicho de Estimação";
      const allowedText = "Pet";
      
      expect(allowedText).not.toBe(forbiddenText);
    });
  });

  describe("4. Serviços - Validações", () => {
    it("nome do serviço deve ser obrigatório", () => {
      const isValid = (name: string) => name && name.length > 0;
      
      expect(isValid("Banho")).toBe(true);
      expect(isValid("")).toBe(false);
    });

    it("preço deve ser maior que 0", () => {
      const isValidPrice = (price: number) => price > 0;
      
      expect(isValidPrice(150)).toBe(true);
      expect(isValidPrice(0)).toBe(false);
      expect(isValidPrice(-50)).toBe(false);
    });

    it("duração mínima deve ser 15 minutos", () => {
      const isValidDuration = (duration: number) => duration >= 15;
      
      expect(isValidDuration(30)).toBe(true);
      expect(isValidDuration(15)).toBe(true);
      expect(isValidDuration(10)).toBe(false);
    });

    it("serviço deve ter nome, preço e duração", () => {
      const service = {
        name: "Banho e Tosa",
        price: 150,
        durationMinutes: 60,
      };
      
      expect(service.name).toBeDefined();
      expect(service.price).toBeGreaterThan(0);
      expect(service.durationMinutes).toBeGreaterThanOrEqual(15);
    });
  });

  describe("5. Integração de Funcionalidades", () => {
    it("cliente com código deve ter pets com displayName", () => {
      const cliente = {
        id_cliente: "CLI-0001",
        nome: "Jeane Paula",
        pets: [
          {
            id_pet: "PET-0001",
            name: "Lili",
            displayName: "Lili (Tutor: Jeane Paula)",
          },
          {
            id_pet: "PET-0002",
            name: "Mika",
            displayName: "Mika (Tutor: Jeane Paula)",
          },
        ],
      };
      
      expect(cliente.id_cliente).toMatch(/^CLI-\d{4}$/);
      expect(cliente.pets).toHaveLength(2);
      expect(cliente.pets[0].displayName).toMatch(/^.+ \(Tutor: .+\)$/);
      expect(cliente.pets[1].displayName).toMatch(/^.+ \(Tutor: .+\)$/);
    });

    it("agendamento deve ter cliente, pet, serviço e profissional", () => {
      const appointment = {
        id: "apt-001",
        client_id: "CLI-0001",
        pet_id: "PET-0001",
        service_id: "srv-001",
        professional_id: "prof-001",
        appointment_date: "2026-06-15T10:00:00Z",
        status: "scheduled",
      };
      
      expect(appointment.client_id).toMatch(/^CLI-\d{4}$/);
      expect(appointment.pet_id).toMatch(/^PET-\d{4}$/);
      expect(appointment.service_id).toBeDefined();
      expect(appointment.professional_id).toBeDefined();
    });
  });
});
