import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { supabase } from "./_core/supabase";
import { generateClientCode, generatePetCode } from "./codeGenerator";

const COOKIE_NAME = "manus_session";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Email já cadastrado");
        }

        // Create user with email as openId
        const openId = `email_${input.email}`;
        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email,
          loginMethod: "email",
          role: "user",
        });

        // Create session token
        const sessionToken = await sdk.createSessionToken(openId, { name: input.name });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return { success: true };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error("Email ou senha inválidos");
        }

        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Clients & Pets routers
  clients: router({
    // List all clients with their associated pets
    list: publicProcedure.query(async () => {
      try {
        // Fetch clientes com join para pets - 1 query em vez de N+1
        const { data: clientes, error } = await supabase
          .from("clientes")
          .select(
            `
            *,
            pets:pets(*)
            `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Transformar resposta para formato esperado
        return (clientes || []).map((cliente: any) => ({
          ...cliente,
          pets: (cliente.pets || []).map((pet: any) => ({
            ...pet,
            displayName: `${pet.name} (Tutor: ${cliente.nome})`,
          })),
        }));
      } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
      }
    }),

    // Get a single client by ID with their pets
    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        try {
          // Fetch cliente com join para pets - 1 query em vez de 2
          const { data: clientes, error } = await supabase
            .from("clientes")
            .select(
              `
              *,
              pets:pets(*)
              `
            )
            .eq("id", input.id)
            .limit(1);

          if (error) throw error;
          if (!clientes || clientes.length === 0) return null;

          const cliente = clientes[0];
          return {
            ...cliente,
            pets: (cliente.pets || []).map((pet: any) => ({
              ...pet,
              displayName: `${pet.name} (Tutor: ${cliente.nome})`,
            })),
          };
        } catch (error) {
          console.error("Error fetching client:", error);
          return null;
        }
      }),

    // Create a new client with all fields
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        phone: z.string().min(1, "Telefone é obrigatório"),
        cpf: z.string().optional(),
        cep: z.string().optional(),
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        isVip: z.boolean().default(false),
        isModelDog: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        try {
          // Gerar código de cliente automaticamente
          const clientCode = await generateClientCode();
          
          const { data, error } = await supabase
            .from("clientes")
            .insert([{
              id_cliente: clientCode,
              nome: input.name,
              email: input.email,
              phone: input.phone,
              cpf: input.cpf || null,
              cep: input.cep || null,
              logradouro: input.logradouro || null,
              numero: input.numero || null,
              complemento: input.complemento || null,
              cidade: input.cidade || null,
              uf: input.uf || null,
              is_vip: input.isVip,
              is_model_dog: input.isModelDog,
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error creating client:", error);
          throw new Error("Erro ao criar cliente");
        }
      }),

    // Update a client with all fields
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        phone: z.string().min(1, "Telefone é obrigatório"),
        cpf: z.string().optional(),
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        cep: z.string().optional(),
        isVip: z.boolean().default(false),
        isModelDog: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...updateData } = input;
          const { data, error } = await supabase
            .from("clientes")
            .update({
              nome: updateData.name,
              email: updateData.email,
              phone: updateData.phone,
              cpf: updateData.cpf || null,
              logradouro: updateData.logradouro || null,
              numero: updateData.numero || null,
              complemento: updateData.complemento || null,
              cidade: updateData.cidade || null,
              uf: updateData.uf || null,
              cep: updateData.cep || null,
              is_vip: updateData.isVip,
              is_model_dog: updateData.isModelDog,
            })
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error updating client:", error);
          throw new Error("Erro ao atualizar cliente");
        }
      }),

    // Delete a client
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        try {
          // Delete all pets first
          await supabase.from("pets").delete().eq("client_id", input.id);

          // Then delete the client
          const { error } = await supabase
            .from("clientes")
            .delete()
            .eq("id", input.id);

          if (error) throw error;
          return { success: true };
        } catch (error) {
          console.error("Error deleting client:", error);
          throw new Error("Erro ao deletar cliente");
        }
      }),
  }),

  // Pets router
  pets: router({
    // Create a new pet with all fields
    create: publicProcedure
      .input(z.object({
        clientId: z.string().uuid(),
        name: z.string().min(1, "Nome do pet é obrigatório"),
        breed: z.string().min(1, "Raça é obrigatória"),
        size: z.string().optional(),
        coatType: z.string().optional(),
        species: z.string().optional(),
        color: z.string().optional(),
        birthDate: z.string().optional(),
        weight: z.string().min(1, "Peso é obrigatório"),
        microchip: z.string().optional(),
        notes: z.string().optional(),
        photo: z.string().optional(),
        status: z.string().default("active"),
        vaccines: z.string().optional(),
        dewormed: z.boolean().optional(),
        hasDiseasesOrAllergies: z.boolean().optional(),
        diseasesOrAllergiesDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Gerar código de pet automaticamente
          const petCode = await generatePetCode();
          
          const { data, error } = await supabase
            .from("pets")
            .insert([{
              id_pet: petCode,
              client_id: input.clientId,
              name: input.name,
              breed: input.breed,
              size: input.size || null,
              coat_type: input.coatType || null,
              species: input.species || null,
              color: input.color || null,
              birth_date: input.birthDate || null,
              weight: input.weight,
              microchip: input.microchip || null,
              notes: input.notes || null,
              photo: input.photo || null,
              status: input.status,
              vaccines: input.vaccines || null,
              dewormed: input.dewormed || false,
              has_diseases_or_allergies: input.hasDiseasesOrAllergies || false,
              diseases_or_allergies_description: input.diseasesOrAllergiesDescription || null,
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error creating pet:", error);
          throw new Error("Erro ao criar pet");
        }
      }),

    // Update a pet with all fields
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Nome do pet é obrigatório"),
        breed: z.string().min(1, "Raça é obrigatória"),
        size: z.string().optional(),
        coatType: z.string().optional(),
        species: z.string().optional(),
        color: z.string().optional(),
        birthDate: z.string().optional(),
        weight: z.string().min(1, "Peso é obrigatório"),
        microchip: z.string().optional(),
        notes: z.string().optional(),
        photo: z.string().optional(),
        status: z.string().default("active"),
        vaccines: z.string().optional(),
        dewormed: z.boolean().optional(),
        hasDiseasesOrAllergies: z.boolean().optional(),
        diseasesOrAllergiesDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...updateData } = input;
          const { data, error } = await supabase
            .from("pets")
            .update({
              name: updateData.name,
              breed: updateData.breed,
              size: updateData.size || null,
              coat_type: updateData.coatType || null,
              species: updateData.species || null,
              color: updateData.color || null,
              birth_date: updateData.birthDate || null,
              weight: updateData.weight,
              microchip: updateData.microchip || null,
              notes: updateData.notes || null,
              photo: updateData.photo || null,
              status: updateData.status,
              vaccines: updateData.vaccines || null,
              dewormed: updateData.dewormed || false,
              has_diseases_or_allergies: updateData.hasDiseasesOrAllergies || false,
              diseases_or_allergies_description: updateData.diseasesOrAllergiesDescription || null,
            })
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error updating pet:", error);
          throw new Error("Erro ao atualizar pet");
        }
      }),

    // Delete a pet
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        try {
          const { error } = await supabase
            .from("pets")
            .delete()
            .eq("id", input.id);

          if (error) throw error;
          return { success: true };
        } catch (error) {
          console.error("Error deleting pet:", error);
          throw new Error("Erro ao deletar pet");
        }
      }),
  }),

  professionals: router({
    // List all professionals
    list: publicProcedure.query(async () => {
      try {
        const { data: professionals, error } = await supabase
          .from("professionals")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return professionals || [];
      } catch (error) {
        console.error("Error fetching professionals:", error);
        return [];
      }
    }),

    // Get a single professional by ID
    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        try {
          const { data: professional, error } = await supabase
            .from("professionals")
            .select("*")
            .eq("id", input.id)
            .single();

          if (error) throw error;
          return professional;
        } catch (error) {
          console.error("Error fetching professional:", error);
          return null;
        }
      }),

    // Create a new professional
    create: publicProcedure
      .input(z.object({
        organizationId: z.string().uuid(),
        unitId: z.string().uuid(),
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        specialization: z.string().optional(),
        status: z.string().default("active"),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("professionals")
            .insert([{
              organization_id: input.organizationId,
              unit_id: input.unitId,
              name: input.name,
              email: input.email || null,
              phone: input.phone || null,
              cpf: input.cpf || null,
              specialization: input.specialization || null,
              status: input.status,
              is_active: true,
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error creating professional:", error);
          throw new Error("Erro ao criar profissional");
        }
      }),

    // Update a professional
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        specialization: z.string().optional(),
        status: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...updateData } = input;
          const updatePayload: Record<string, any> = {};
          
          if (updateData.name) updatePayload.name = updateData.name;
          if (updateData.email) updatePayload.email = updateData.email;
          if (updateData.phone) updatePayload.phone = updateData.phone;
          if (updateData.cpf) updatePayload.cpf = updateData.cpf;
          if (updateData.specialization) updatePayload.specialization = updateData.specialization;
          if (updateData.status) updatePayload.status = updateData.status;

          const { data, error } = await supabase
            .from("professionals")
            .update(updatePayload)
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error updating professional:", error);
          throw new Error("Erro ao atualizar profissional");
        }
      }),

    // Delete a professional
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        try {
          const { error } = await supabase
            .from("professionals")
            .delete()
            .eq("id", input.id);

          if (error) throw error;
          return { success: true };
        } catch (error) {
          console.error("Error deleting professional:", error);
          throw new Error("Erro ao deletar profissional");
        }
      }),
  }),

  appointments: router({
    // List all appointments with related data
    list: publicProcedure.query(async () => {
      try {
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select(`
            *,
            client:client_id(name, email, phone),
            pet:pet_id(name, breed, species),
            service:service_id(name, price, duration_minutes),
            professional:professional_id(name, specialization)
          `)
          .order("appointment_date", { ascending: false });

        if (error) throw error;
        return appointments || [];
      } catch (error) {
        console.error("Error fetching appointments:", error);
        return [];
      }
    }),

    // Get a single appointment by ID
    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        try {
          const { data: appointment, error } = await supabase
            .from("appointments")
            .select(`
              *,
              client:client_id(name, email, phone),
              pet:pet_id(name, breed, species),
              service:service_id(name, price, duration_minutes),
              professional:professional_id(name, specialization)
            `)
            .eq("id", input.id)
            .single();

          if (error) throw error;
          return appointment;
        } catch (error) {
          console.error("Error fetching appointment:", error);
          return null;
        }
      }),

    // Create a new appointment
    create: publicProcedure
      .input(z.object({
        organizationId: z.string().uuid(),
        unitId: z.string().uuid(),
        clientId: z.string().uuid(),
        petId: z.string().uuid(),
        serviceId: z.string().uuid(),
        professionalId: z.string().uuid(),
        appointmentDate: z.string().datetime(),
        startTime: z.string().optional(),
        durationMinutes: z.number().optional(),
        status: z.string().default("pending"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("appointments")
            .insert([{
              organization_id: input.organizationId,
              unit_id: input.unitId,
              client_id: input.clientId,
              pet_id: input.petId,
              service_id: input.serviceId,
              professional_id: input.professionalId,
              appointment_date: input.appointmentDate,
              start_time: input.startTime || null,
              duration_minutes: input.durationMinutes || null,
              status: input.status,
              notes: input.notes || null,
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error creating appointment:", error);
          throw new Error("Erro ao criar agendamento");
        }
      }),

    // Update an appointment
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        clientId: z.string().uuid().optional(),
        petId: z.string().uuid().optional(),
        serviceId: z.string().uuid().optional(),
        professionalId: z.string().uuid().optional(),
        appointmentDate: z.string().datetime().optional(),
        startTime: z.string().optional(),
        durationMinutes: z.number().optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const updateData: Record<string, any> = {};
          if (input.clientId) updateData.client_id = input.clientId;
          if (input.petId) updateData.pet_id = input.petId;
          if (input.serviceId) updateData.service_id = input.serviceId;
          if (input.professionalId) updateData.professional_id = input.professionalId;
          if (input.appointmentDate) updateData.appointment_date = input.appointmentDate;
          if (input.startTime) updateData.start_time = input.startTime;
          if (input.durationMinutes) updateData.duration_minutes = input.durationMinutes;
          if (input.status) updateData.status = input.status;
          if (input.notes !== undefined) updateData.notes = input.notes || null;

          const { data, error } = await supabase
            .from("appointments")
            .update(updateData)
            .eq("id", input.id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error updating appointment:", error);
          throw new Error("Erro ao atualizar agendamento");
        }
      }),

    // Delete an appointment
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        try {
          const { error } = await supabase
            .from("appointments")
            .delete()
            .eq("id", input.id);

          if (error) throw error;
          return { success: true };
        } catch (error) {
          console.error("Error deleting appointment:", error);
          throw new Error("Erro ao deletar agendamento");
        }
      }),
  }),

  services: router({
    // List all services
    list: publicProcedure.query(async () => {
      try {
        const { data: services, error } = await supabase
          .from("services")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        return services || [];
      } catch (error) {
        console.error("Error fetching services:", error);
        return [];
      }
    }),

    // Get a single service by ID
    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        try {
          const { data: service, error } = await supabase
            .from("services")
            .select("*")
            .eq("id", input.id)
            .single();

          if (error) throw error;
          return service;
        } catch (error) {
          console.error("Error fetching service:", error);
          return null;
        }
      }),

    // Create a new service
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome do serviço é obrigatório"),
        description: z.string().optional(),
        price: z.number().min(0, "Preço deve ser maior que 0"),
        durationMinutes: z.number().min(15, "Duração mínima é 15 minutos"),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("services")
            .insert([{
              name: input.name,
              description: input.description || null,
              price: input.price,
              duration_minutes: input.durationMinutes,
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error creating service:", error);
          throw new Error("Erro ao criar serviço");
        }
      }),

    // Update a service
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Nome do serviço é obrigatório").optional(),
        description: z.string().optional(),
        price: z.number().min(0, "Preço deve ser maior que 0").optional(),
        durationMinutes: z.number().min(15, "Duração mínima é 15 minutos").optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...updateData } = input;
          const updatePayload: Record<string, any> = {};
          
          if (updateData.name) updatePayload.name = updateData.name;
          if (updateData.description !== undefined) updatePayload.description = updateData.description || null;
          if (updateData.price !== undefined) updatePayload.price = updateData.price;
          if (updateData.durationMinutes !== undefined) updatePayload.duration_minutes = updateData.durationMinutes;

          const { data, error } = await supabase
            .from("services")
            .update(updatePayload)
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error updating service:", error);
          throw new Error("Erro ao atualizar serviço");
        }
      }),

    // Delete a service
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        try {
          const { error } = await supabase
            .from("services")
            .delete()
            .eq("id", input.id);

          if (error) throw error;
          return { success: true };
        } catch (error) {
          console.error("Error deleting service:", error);
          throw new Error("Erro ao deletar serviço");
        }
      }),
  }),

  packages: router({
    // List all packages
    list: publicProcedure.query(async () => {
      try {
        const { data: packages, error } = await supabase
          .from("packages")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        return packages || [];
      } catch (error) {
        console.error("Error fetching packages:", error);
        return [];
      }
    }),

    // Get a single package by ID
    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        try {
          const { data: pkg, error } = await supabase
            .from("packages")
            .select("*")
            .eq("id", input.id)
            .single();

          if (error) throw error;
          return pkg;
        } catch (error) {
          console.error("Error fetching package:", error);
          return null;
        }
      }),

    // Create a new package
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome do plano é obrigatório"),
        description: z.string().optional(),
        totalBaths: z.number().min(0, "Qtd de banhos deve ser >= 0"),
        totalGroomings: z.number().min(0, "Qtd de tosas deve ser >= 0"),
        totalPrice: z.number().min(0, "Valor total deve ser > 0"),
        monthlyPrice: z.number().min(0, "Valor mensal deve ser >= 0").optional(),
        recurrenceType: z.string().optional(),
        status: z.string().default("active"),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("packages")
            .insert([{
              name: input.name,
              description: input.description || null,
              total_baths: input.totalBaths,
              total_groomings: input.totalGroomings,
              total_price: input.totalPrice,
              monthly_price: input.monthlyPrice || 0,
              recurrence_type: input.recurrenceType || null,
              status: input.status,
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error creating package:", error);
          throw new Error("Erro ao criar plano");
        }
      }),

    // Update a package
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        totalBaths: z.number().min(0).optional(),
        totalGroomings: z.number().min(0).optional(),
        totalPrice: z.number().min(0).optional(),
        monthlyPrice: z.number().min(0).optional(),
        recurrenceType: z.string().optional(),
        status: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...updateData } = input;
          const updatePayload: Record<string, any> = {};

          if (updateData.name) updatePayload.name = updateData.name;
          if (updateData.description !== undefined) updatePayload.description = updateData.description || null;
          if (updateData.totalBaths !== undefined) updatePayload.total_baths = updateData.totalBaths;
          if (updateData.totalGroomings !== undefined) updatePayload.total_groomings = updateData.totalGroomings;
          if (updateData.totalPrice !== undefined) updatePayload.total_price = updateData.totalPrice;
          if (updateData.monthlyPrice !== undefined) updatePayload.monthly_price = updateData.monthlyPrice;
          if (updateData.recurrenceType !== undefined) updatePayload.recurrence_type = updateData.recurrenceType || null;
          if (updateData.status) updatePayload.status = updateData.status;

          const { data, error } = await supabase
            .from("packages")
            .update(updatePayload)
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error updating package:", error);
          throw new Error("Erro ao atualizar plano");
        }
      }),

    // Delete a package
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        try {
          const { error } = await supabase
            .from("packages")
            .delete()
            .eq("id", input.id);

          if (error) throw error;
          return { success: true };
        } catch (error) {
          console.error("Error deleting package:", error);
          throw new Error("Erro ao deletar plano");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
