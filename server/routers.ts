import { z } from "zod";
import { systemRouter } from "./_core/systemRouter.js";
import { protectedProcedure, publicProcedure as anonymousProcedure, router } from "./_core/trpc.js";
import * as db from "./db.js";
import { supabase, supabaseAdmin } from "./_core/supabase.js";
import { generateClientCode, generatePetCode } from "./codeGenerator.js";
import { sendAppointmentConfirmationEmail } from "./_core/emailService.js";

// Business routes are authenticated by default. Database RLS applies the
// organization and unit boundaries to each request.
const publicProcedure = protectedProcedure;

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: anonymousProcedure.query(opts => opts.ctx.user),

    updateProfile: protectedProcedure
      .input(z.object({
        fullName: z.string().trim().min(2, "Informe o nome completo").max(120),
        displayName: z.string().trim().min(2, "Informe o nome de exibição").max(80),
        phone: z.string().trim().max(30).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Sessão inválida");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: input.fullName,
            display_name: input.displayName,
            phone: input.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ctx.user.id)
          .select("full_name, display_name, phone")
          .single();

        if (profileError) {
          console.error("Error updating own profile:", profileError);
          throw new Error("Não foi possível atualizar o perfil");
        }

        const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
          ctx.user.id,
          {
            user_metadata: {
              full_name: profile.full_name,
              display_name: profile.display_name,
              name: profile.display_name,
            },
          },
        );

        if (metadataError) {
          console.error("Error syncing auth display name:", metadataError);
          throw new Error("Perfil salvo, mas o nome de exibição não foi sincronizado");
        }

        return {
          ...ctx.user,
          name: profile.full_name,
          displayName: profile.display_name,
          phone: profile.phone,
        };
      }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        throw new Error("Cadastro legado desativado; use o Supabase Auth");
        /* Legacy implementation retained temporarily for migration history.
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

        return { success: true }; */
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        throw new Error("Login legado desativado; use o Supabase Auth");
        /* Legacy implementation retained temporarily for migration history.
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error("Email ou senha inválidos");
        }

        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return { success: true }; */
      }),

    logout: publicProcedure.mutation(() => {
      return {
        success: true,
      } as const;
    }),
  }),

  workspace: router({
    context: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Sessão inválida");

      const { organizationId, unitId } = ctx.user;

      if (!organizationId) {
        return {
          organization: null,
          currentUnit: null,
          units: [],
          legalEntities: [],
        };
      }

      const [
        organizationResult,
        accessResult,
        legalEntitiesResult,
        businessAreasResult,
      ] = await Promise.all([
        supabase
          .from("organizations")
          .select("id, name, trading_name")
          .eq("id", organizationId)
          .maybeSingle(),
        supabase
          .from("user_unit_access")
          .select(`
            unit_id,
            access_role,
            is_default,
            unit:units(
              id,
              legal_entity_id,
              name,
              code,
              cnpj,
              razao_social,
              city,
              state,
              operation_mode,
              ownership_model,
              status,
              is_active
            )
          `)
          .eq("active", true),
        supabase
          .from("legal_entities")
          .select(`
            id,
            company_name,
            trading_name,
            tax_id,
            entity_kind,
            city,
            state,
            status,
            is_active
          `)
          .eq("organization_id", organizationId)
          .order("trading_name", { ascending: true }),
        supabase
          .from("unit_business_areas")
          .select("unit_id, business_area, cost_center_code, active")
          .eq("organization_id", organizationId)
          .eq("active", true),
      ]);

      const firstError =
        organizationResult.error ||
        accessResult.error ||
        legalEntitiesResult.error ||
        businessAreasResult.error;
      if (firstError) {
        console.error("Error loading workspace context:", firstError);
        throw new Error("Não foi possível carregar as empresas e unidades");
      }

      const businessAreasByUnit = new Map<string, typeof businessAreasResult.data>();
      for (const area of businessAreasResult.data ?? []) {
        const current = businessAreasByUnit.get(area.unit_id) ?? [];
        current.push(area);
        businessAreasByUnit.set(area.unit_id, current);
      }

      const units = (accessResult.data ?? [])
        .map((access: any) => {
          const unit = Array.isArray(access.unit) ? access.unit[0] : access.unit;
          if (!unit) return null;
          return {
            ...unit,
            accessRole: access.access_role,
            isDefault: access.is_default,
            businessAreas: businessAreasByUnit.get(unit.id) ?? [],
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.name.localeCompare(b.name, "pt-BR"));

      return {
        organization: organizationResult.data,
        currentUnit:
          units.find((unit: any) => unit.id === unitId) ??
          units.find((unit: any) => unit.isDefault) ??
          units[0] ??
          null,
        units,
        legalEntities: legalEntitiesResult.data ?? [],
      };
    }),

    switchUnit: protectedProcedure
      .input(z.object({ unitId: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const { data, error } = await supabase.rpc("switch_active_unit", {
          target_unit_id: input.unitId,
        });

        if (error) {
          console.error("Error switching active unit:", error);
          throw new Error("Você não tem acesso a esta unidade");
        }

        return { unitId: data as string };
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
          id: cliente.id,
          name: cliente.nome,
          email: cliente.email,
          phone: cliente.phone,
          cpf: cliente.cpf,
          isVip: cliente.is_vip,
          isModelDog: cliente.is_model_dog,
          status: cliente.status,
          pets: (cliente.pets || []).map((pet: any) => ({
            ...pet,
            displayName: `${pet.name} (${cliente.nome})`,
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
            id: cliente.id,
            name: cliente.nome,
            email: cliente.email,
            phone: cliente.phone,
            cpf: cliente.cpf,
            isVip: cliente.is_vip,
            isModelDog: cliente.is_model_dog,
            status: cliente.status,
            pets: (cliente.pets || []).map((pet: any) => ({
              ...pet,
              displayName: `${pet.name} (${cliente.nome})`,
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
    uploadPhoto: publicProcedure
      .input(z.object({
        petId: z.string().uuid(),
        base64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user) throw new Error("Sessão inválida");
          const { data: pet, error: petError } = await supabase
            .from("pets")
            .select("id")
            .eq("id", input.petId)
            .maybeSingle();
          if (petError) throw petError;
          if (!pet) throw new Error("Pet não encontrado nesta organização");

          const base64Data = input.base64.split(",")[1] || input.base64;
          const buffer = Buffer.from(base64Data, "base64");
          if (!["image/jpeg", "image/png", "image/webp"].includes(input.mimeType)) {
            throw new Error("Formato de imagem não permitido");
          }
          if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
            throw new Error("A imagem deve ter no máximo 5 MB");
          }

          const timestamp = Date.now();
          const safeName = input.fileName
            .normalize("NFKD")
            .replace(/[^a-zA-Z0-9._-]/g, "-")
            .slice(-100);
          const tenant = ctx.user.organizationId ?? `user-${ctx.user.id}`;
          const fileKey = `${tenant}/pets/${input.petId}/${timestamp}-${safeName}`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from("pet-photos")
            .upload(fileKey, buffer, {
              contentType: input.mimeType,
              upsert: false,
            });
          if (uploadError) throw uploadError;

          const { data: signed, error: signedError } = await supabaseAdmin.storage
            .from("pet-photos")
            .createSignedUrl(fileKey, 60 * 10);
          if (signedError) throw signedError;

          return { url: signed.signedUrl, key: fileKey, success: true };
        } catch (error) {
          console.error("Error uploading pet photo:", error);
          throw new Error("Erro ao fazer upload da foto");
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
            client:client_id(nome, email, phone),
            pet:pet_id(name, breed, sexo),
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
              client:client_id(nome, email, phone),
              pet:pet_id(name, breed, sexo),
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
        sendEmail: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        try {
          // Validar que cliente, pet e serviço existem
          const [clientRes, petRes, serviceRes, profRes] = await Promise.all([
            supabase.from("clientes").select("id").eq("id", input.clientId).single(),
            supabase.from("pets").select("id").eq("id", input.petId).single(),
            supabase.from("services").select("id").eq("id", input.serviceId).single(),
            supabase.from("professionals").select("id").eq("id", input.professionalId).single(),
          ]);

          if (!clientRes.data) throw new Error("Cliente não encontrado");
          if (!petRes.data) throw new Error("Pet não encontrado");
          if (!serviceRes.data) throw new Error("Serviço não encontrado");
          if (!profRes.data) throw new Error("Profissional não encontrado");

          // Buscar organization e unit reais do banco
          const { data: orgData } = await supabase
            .from("organizations")
            .select("id")
            .limit(1)
            .single();
          
          const { data: unitData } = await supabase
            .from("units")
            .select("id")
            .limit(1)
            .single();
          
          const organizationId = orgData?.id || input.organizationId;
          const unitId = unitData?.id || input.unitId;

          const { data, error } = await supabase
            .from("appointments")
            .insert([{
              organization_id: organizationId,
              unit_id: unitId,
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

          // Enviar email se solicitado
          if (input.sendEmail) {
            try {
              // Buscar dados do cliente, pet e serviço
              const [clientRes, petRes, serviceRes] = await Promise.all([
                supabase.from("clientes").select("nome, email").eq("id", input.clientId).single(),
                supabase.from("pets").select("name").eq("id", input.petId).single(),
                supabase.from("services").select("name").eq("id", input.serviceId).single(),
              ]);

              if (clientRes.data && petRes.data && serviceRes.data) {
                await sendAppointmentConfirmationEmail(
                  clientRes.data.email,
                  clientRes.data.nome,
                  petRes.data.name,
                  serviceRes.data.name,
                  input.appointmentDate,
                  input.startTime || "Horário a confirmar"
                );
              }
            } catch (emailError) {
              console.error("Erro ao enviar email:", emailError);
              // Não lançar erro se o email falhar
            }
          }

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

  students: router({
    // List all students with filters
    list: publicProcedure
      .input(z.object({
        filter: z.enum(["all", "authorized", "blocked", "by_instructor"]).default("all"),
        instructorId: z.string().uuid().optional(),
      }).optional())
      .query(async ({ input }) => {
        try {
          let query = supabase
            .from("students")
            .select(`
              *,
              instructor:instructor_id(id, name, specialization)
            `)
            .order("created_at", { ascending: false });

          // Apply filters
          if (input?.filter === "authorized") {
            query = query.eq("is_authorized", true);
          } else if (input?.filter === "blocked") {
            query = query.eq("is_authorized", false);
          } else if (input?.filter === "by_instructor" && input?.instructorId) {
            query = query.eq("instructor_id", input.instructorId);
          }

          const { data: students, error } = await query;

          if (error) throw error;
          return students || [];
        } catch (error) {
          console.error("Error fetching students:", error);
          return [];
        }
      }),

    // Get a single student by ID
    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        try {
          const { data: student, error } = await supabase
            .from("students")
            .select(`
              *,
              instructor:instructor_id(id, name, specialization)
            `)
            .eq("id", input.id)
            .single();

          if (error) throw error;
          return student;
        } catch (error) {
          console.error("Error fetching student:", error);
          return null;
        }
      }),

    // Create a new student
    create: publicProcedure
      .input(z.object({
        organizationId: z.string().uuid(),
        unitId: z.string().uuid().optional(),
        academicId: z.string().optional(),
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        photoUrl: z.string().optional(),
        course: z.string().optional(),
        classGroup: z.string().optional(),
        academicStatus: z.string().default("active"),
        enrollmentDate: z.string().datetime().optional(),
        instructorId: z.string().uuid().optional(),
        isAuthorized: z.boolean().default(false),
        blockReason: z.string().optional(),
        practiceLevel: z.string().default("beginner"),
        allowedServices: z.string().optional(),
        allowedDogSizes: z.string().optional(),
        needsSupervision: z.boolean().default(true),
        canWorkAlone: z.boolean().default(false),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("students")
            .insert([{
              organization_id: input.organizationId,
              unit_id: input.unitId || null,
              academic_id: input.academicId || null,
              name: input.name,
              email: input.email || null,
              phone: input.phone || null,
              cpf: input.cpf || null,
              photo_url: input.photoUrl || null,
              course: input.course || null,
              class_group: input.classGroup || null,
              academic_status: input.academicStatus,
              enrollment_date: input.enrollmentDate || new Date().toISOString(),
              instructor_id: input.instructorId || null,
              is_authorized: input.isAuthorized,
              block_reason: input.blockReason || null,
              practice_level: input.practiceLevel,
              allowed_services: input.allowedServices || null,
              allowed_dog_sizes: input.allowedDogSizes || null,
              needs_supervision: input.needsSupervision,
              can_work_alone: input.canWorkAlone,
              notes: input.notes || null,
              data_origin: "manual",
              sync_status: "pending",
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error creating student:", error);
          throw new Error("Erro ao criar aluno");
        }
      }),

    // Update a student
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        photoUrl: z.string().optional(),
        course: z.string().optional(),
        classGroup: z.string().optional(),
        academicStatus: z.string().optional(),
        instructorId: z.string().uuid().optional(),
        isAuthorized: z.boolean().optional(),
        blockReason: z.string().optional(),
        practiceLevel: z.string().optional(),
        allowedServices: z.string().optional(),
        allowedDogSizes: z.string().optional(),
        needsSupervision: z.boolean().optional(),
        canWorkAlone: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...updateData } = input;
          const updatePayload: Record<string, any> = {};

          if (updateData.name) updatePayload.name = updateData.name;
          if (updateData.email !== undefined) updatePayload.email = updateData.email || null;
          if (updateData.phone !== undefined) updatePayload.phone = updateData.phone || null;
          if (updateData.photoUrl !== undefined) updatePayload.photo_url = updateData.photoUrl || null;
          if (updateData.course !== undefined) updatePayload.course = updateData.course || null;
          if (updateData.classGroup !== undefined) updatePayload.class_group = updateData.classGroup || null;
          if (updateData.academicStatus) updatePayload.academic_status = updateData.academicStatus;
          if (updateData.instructorId !== undefined) updatePayload.instructor_id = updateData.instructorId || null;
          if (updateData.isAuthorized !== undefined) updatePayload.is_authorized = updateData.isAuthorized;
          if (updateData.blockReason !== undefined) updatePayload.block_reason = updateData.blockReason || null;
          if (updateData.practiceLevel) updatePayload.practice_level = updateData.practiceLevel;
          if (updateData.allowedServices !== undefined) updatePayload.allowed_services = updateData.allowedServices || null;
          if (updateData.allowedDogSizes !== undefined) updatePayload.allowed_dog_sizes = updateData.allowedDogSizes || null;
          if (updateData.needsSupervision !== undefined) updatePayload.needs_supervision = updateData.needsSupervision;
          if (updateData.canWorkAlone !== undefined) updatePayload.can_work_alone = updateData.canWorkAlone;
          if (updateData.notes !== undefined) updatePayload.notes = updateData.notes || null;
          updatePayload.updated_at = new Date().toISOString();

          const { data, error } = await supabase
            .from("students")
            .update(updatePayload)
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error updating student:", error);
          throw new Error("Erro ao atualizar aluno");
        }
      }),

    // Delete a student
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        try {
          const { error } = await supabase
            .from("students")
            .delete()
            .eq("id", input.id);

          if (error) throw error;
          return { success: true };
        } catch (error) {
          console.error("Error deleting student:", error);
          throw new Error("Erro ao deletar aluno");
        }
      }),

    // Get student progress for a course
    getProgress: publicProcedure
      .input(z.object({
        studentId: z.string().uuid(),
        courseId: z.string().uuid().optional(),
      }))
      .query(async ({ input }) => {
        try {
          // Get student info
          const { data: student, error: studentError } = await supabase
            .from("students")
            .select("id, course")
            .eq("id", input.studentId)
            .single();

          if (studentError) throw studentError;
          if (!student) return { totalAulas: 0, diasPratica: 0, percentualProgresso: 0 };

          // Get course info (from services table)
          const courseId = input.courseId || student.course;
          if (!courseId) return { totalAulas: 0, diasPratica: 0, percentualProgresso: 0 };

          const { data: course, error: courseError } = await supabase
            .from("services")
            .select("id, name, metadata")
            .eq("id", courseId)
            .single();

          if (courseError) throw courseError;
          if (!course) return { totalAulas: 0, diasPratica: 0, percentualProgresso: 0 };

          // Parse total aulas from course metadata
          const metadata = course.metadata ? JSON.parse(course.metadata) : {};
          const totalAulas = metadata.totalAulas || 12; // Default 12 aulas

          // Get unique practice days from appointmentStudents
          const { data: appointmentStudents, error: appointmentsError } = await supabase
            .from("appointmentStudents")
            .select(`
              appointment:appointment_id(appointment_date, service_id)
            `)
            .eq("student_id", input.studentId);

          if (appointmentsError) throw appointmentsError;

          // Count unique days for this course
          const uniqueDays = new Set();
          (appointmentStudents || []).forEach((as: any) => {
            if (as.appointment && as.appointment.service_id === courseId && as.appointment.appointment_date) {
              const dateOnly = as.appointment.appointment_date.split("T")[0];
              uniqueDays.add(dateOnly);
            }
          });

          const diasPratica = uniqueDays.size;
          const percentualProgresso = Math.round((diasPratica / totalAulas) * 100);

          return {
            totalAulas,
            diasPratica,
            percentualProgresso,
            courseName: course.name,
          };
        } catch (error) {
          console.error("Error calculating student progress:", error);
          return { totalAulas: 0, diasPratica: 0, percentualProgresso: 0 };
        }
      }),

    // Get student attendances/appointments from appointmentStudents
    getAttendances: publicProcedure
      .input(z.object({
        studentId: z.string().uuid(),
      }))
      .query(async ({ input }) => {
        try {
          const { data: appointmentStudents, error } = await supabase
            .from("appointmentStudents")
            .select(`
              id,
              role,
              appointment:appointment_id(
                id,
                appointment_date,
                status,
                notes,
                service:service_id(id, name),
                professional:professional_id(id, name),
                pet:pet_id(id, name)
              )
            `)
            .eq("student_id", input.studentId)
            .order("appointment_id", { ascending: false });

          if (error) throw error;
          return appointmentStudents || [];
        } catch (error) {
          console.error("Error fetching student attendances:", error);
          return [];
        }
      }),

    // Upload student photo
    uploadPhoto: publicProcedure
      .input(z.object({
        studentId: z.string().uuid(),
        photoUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("students")
            .update({ photo_url: input.photoUrl })
            .eq("id", input.studentId)
            .select()
            .single();

          if (error) throw error;
          return { success: true, photoUrl: data.photo_url };
        } catch (error) {
          console.error("Error uploading student photo:", error);
          throw new Error("Erro ao fazer upload da foto");
        }
      }),

    // Validate student permissions for appointment
    validatePermissions: publicProcedure
      .input(z.object({
        studentId: z.string().uuid(),
        serviceId: z.string().uuid().optional(),
        dogSize: z.string().optional(),
      }))
      .query(async ({ input }) => {
        try {
          const { data: student, error } = await supabase
            .from("students")
            .select("*")
            .eq("id", input.studentId)
            .single();

          if (error) throw error;
          if (!student) return { valid: false, reason: "Aluno não encontrado" };

          // Check authorization
          if (!student.is_authorized) {
            return { valid: false, reason: student.block_reason || "Aluno não autorizado para prática" };
          }

          // Check academic status
          if (student.academic_status !== "active") {
            return { valid: false, reason: "Aluno não está ativo no portal acadêmico" };
          }

          // Check allowed services
          if (input.serviceId && student.allowed_services) {
            const allowedServices = JSON.parse(student.allowed_services || "[]");
            if (allowedServices.length > 0 && !allowedServices.includes(input.serviceId)) {
              return { valid: false, reason: "Aluno não está autorizado para este serviço" };
            }
          }

          // Check allowed dog sizes
          if (input.dogSize && student.allowed_dog_sizes) {
            const allowedSizes = JSON.parse(student.allowed_dog_sizes || "[]");
            if (allowedSizes.length > 0 && !allowedSizes.includes(input.dogSize)) {
              return { valid: false, reason: "Aluno não está autorizado para este porte de cão" };
            }
          }

          return {
            valid: true,
            student,
            needsSupervision: student.needs_supervision,
            canWorkAlone: student.can_work_alone,
          };
        } catch (error) {
          console.error("Error validating student permissions:", error);
          return { valid: false, reason: "Erro ao validar permissões" };
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
