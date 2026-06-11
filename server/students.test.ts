import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Testes para o módulo de Students (Alunos)
 * Valida CRUD completo e validação de permissões
 */

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Students Router", () => {
  describe("students.list", () => {
    it("deve listar todos os alunos", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.students.list({ filter: "all" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve listar apenas alunos autorizados", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.students.list({ filter: "authorized" });
      expect(Array.isArray(result)).toBe(true);
      
      // Todos devem ter is_authorized = true
      result.forEach((student: any) => {
        expect(student.is_authorized).toBe(true);
      });
    });

    it("deve listar apenas alunos bloqueados", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.students.list({ filter: "blocked" });
      expect(Array.isArray(result)).toBe(true);
      
      // Todos devem ter is_authorized = false
      result.forEach((student: any) => {
        expect(student.is_authorized).toBe(false);
      });
    });
  });

  describe("students.create", () => {
    it("deve criar um novo aluno com dados mínimos", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const newStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Teste",
        email: "aluno.teste@example.com",
        phone: "(11) 9999-9999",
      });

      expect(newStudent).toBeDefined();
      expect(newStudent.id).toBeDefined();
      expect(newStudent.name).toBe("Aluno Teste");
      expect(newStudent.email).toBe("aluno.teste@example.com");
      expect(newStudent.is_authorized).toBe(false); // Padrão
    });

    it("deve criar um aluno com dados operacionais completos", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const newStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Completo",
        email: "aluno.completo@example.com",
        phone: "(11) 8888-8888",
        course: "Grooming Avançado",
        classGroup: "Turma B",
        academicStatus: "active",
        isAuthorized: true,
        practiceLevel: "intermediate",
        needsSupervision: false,
        canWorkAlone: true,
        notes: "Aluno destaque",
      });

      expect(newStudent.is_authorized).toBe(true);
      expect(newStudent.practice_level).toBe("intermediate");
      expect(newStudent.needs_supervision).toBe(false);
      expect(newStudent.can_work_alone).toBe(true);
      expect(newStudent.notes).toBe("Aluno destaque");
    });
  });

  describe("students.getById", () => {
    it("deve buscar um aluno por ID", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar um aluno para teste
      const newStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno para Busca",
        email: "busca@example.com",
      });

      const student = await caller.students.getById({ id: newStudent.id });
      expect(student).toBeDefined();
      expect(student.id).toBe(newStudent.id);
    });

    it("deve retornar null para ID inexistente", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const student = await caller.students.getById({
        id: "00000000-0000-0000-0000-000000000000",
      });
      expect(student).toBeNull();
    });
  });

  describe("students.update", () => {
    it("deve atualizar dados de um aluno", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar um aluno para atualizar
      const newStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno para Atualizar",
        email: "atualizar@example.com",
      });

      const updated = await caller.students.update({
        id: newStudent.id,
        name: "Aluno Atualizado",
        isAuthorized: true,
        practiceLevel: "advanced",
      });

      expect(updated.name).toBe("Aluno Atualizado");
      expect(updated.is_authorized).toBe(true);
      expect(updated.practice_level).toBe("advanced");
    });

    it("deve permitir atualização parcial", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar um aluno para atualizar
      const newStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Parcial",
        email: "parcial@example.com",
      });

      const updated = await caller.students.update({
        id: newStudent.id,
        notes: "Novas observações",
      });

      expect(updated.notes).toBe("Novas observações");
      expect(updated.name).toBe("Aluno Parcial"); // Não foi alterado
    });

    it("deve bloquear aluno com motivo", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar um aluno para bloquear
      const newStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Bloqueado",
        email: "bloqueado@example.com",
      });

      const updated = await caller.students.update({
        id: newStudent.id,
        isAuthorized: false,
        blockReason: "Aguardando conclusão de módulo",
      });

      expect(updated.is_authorized).toBe(false);
      expect(updated.block_reason).toBe("Aguardando conclusão de módulo");
    });
  });

  describe("students.delete", () => {
    it("deve deletar um aluno", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar um aluno para deletar
      const newStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno para Deletar",
        email: "deletar@example.com",
      });

      const result = await caller.students.delete({ id: newStudent.id });
      expect(result.success).toBe(true);

      // Verificar que foi deletado
      const deleted = await caller.students.getById({ id: newStudent.id });
      expect(deleted).toBeNull();
    });
  });

  describe("students.validatePermissions", () => {
    it("deve validar permissões de aluno autorizado", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar aluno autorizado
      const authorizedStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Autorizado",
        email: "autorizado@example.com",
        isAuthorized: true,
        academicStatus: "active",
        practiceLevel: "intermediate",
        needsSupervision: true,
      });

      const validation = await caller.students.validatePermissions({
        studentId: authorizedStudent.id,
      });

      expect(validation.valid).toBe(true);
      expect(validation.student).toBeDefined();
      expect(validation.needsSupervision).toBe(true);
    });

    it("deve rejeitar aluno não autorizado", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar aluno bloqueado
      const blockedStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Bloqueado",
        email: "bloqueado.perm@example.com",
        isAuthorized: false,
        blockReason: "Aguardando documentação",
      });

      const validation = await caller.students.validatePermissions({
        studentId: blockedStudent.id,
      });

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain("não autorizado");
    });

    it("deve rejeitar aluno com status acadêmico inativo", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar aluno com status inativo
      const inactiveStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Inativo",
        email: "inativo@example.com",
        isAuthorized: true,
        academicStatus: "inactive",
      });

      const validation = await caller.students.validatePermissions({
        studentId: inactiveStudent.id,
      });

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain("não está ativo");
    });

    it("deve retornar informações de supervisão", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar aluno que precisa supervisão
      const supervisedStudent = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Supervisionado",
        email: "supervisionado@example.com",
        isAuthorized: true,
        academicStatus: "active",
        needsSupervision: true,
        canWorkAlone: false,
      });

      const validation = await caller.students.validatePermissions({
        studentId: supervisedStudent.id,
      });

      expect(validation.needsSupervision).toBe(true);
      expect(validation.canWorkAlone).toBe(false);
    });
  });

  describe("Integração com Agendamentos", () => {
    it("deve permitir agendamento com aluno autorizado", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar aluno autorizado
      const student = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Agendamento",
        email: "agendamento@example.com",
        isAuthorized: true,
        academicStatus: "active",
      });

      // Validar permissões
      const validation = await caller.students.validatePermissions({
        studentId: student.id,
      });

      expect(validation.valid).toBe(true);
    });

    it("deve impedir agendamento com aluno bloqueado", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Criar aluno bloqueado
      const student = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Bloqueado Agendamento",
        email: "bloqueado.agendamento@example.com",
        isAuthorized: false,
        blockReason: "Documentação incompleta",
      });

      // Validar permissões
      const validation = await caller.students.validatePermissions({
        studentId: student.id,
      });

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain("não autorizado");
    });
  });

  describe("Dados Operacionais", () => {
    it("deve armazenar dados operacionais completos", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const student = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Operacional",
        email: "operacional@example.com",
        practiceLevel: "advanced",
        needsSupervision: false,
        canWorkAlone: true,
        notes: "Aluno de destaque",
      });

      const fetched = await caller.students.getById({ id: student.id });

      expect(fetched.practice_level).toBe("advanced");
      expect(fetched.needs_supervision).toBe(false);
      expect(fetched.can_work_alone).toBe(true);
      expect(fetched.notes).toBe("Aluno de destaque");
    });

    it("deve rastrear timestamps de criação e atualização", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const student = await caller.students.create({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        unitId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Aluno Rastreado",
        email: "rastreado@example.com",
      });

      const fetched = await caller.students.getById({ id: student.id });

      // Verificar campos de integração
      expect(fetched.created_at).toBeDefined();
      expect(fetched.updated_at).toBeDefined();
    });
  });
});
