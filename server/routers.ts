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

function buildPlanCode(audienceCode: string, durationMonths: number) {
  const durationCode: Record<number, string> = { 1: "M1", 3: "T3", 6: "S6", 12: "A12" };
  return `PLN-${audienceCode.trim().toUpperCase()}-${durationCode[durationMonths] || `M${durationMonths}`}`;
}

async function attachPetPhotoUrls(pets: any[]) {
  return Promise.all(
    pets.map(async (pet) => {
      if (!pet.photo_storage_key) return pet;
      const { data, error } = await supabaseAdmin.storage
        .from("pet-photos")
        .createSignedUrl(pet.photo_storage_key, 60 * 60);
      if (error || !data?.signedUrl) return pet;
      return {
        ...pet,
        photo: data.signedUrl,
        foto_url: data.signedUrl,
      };
    }),
  );
}

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

    saveUnit: protectedProcedure
      .input(z.object({
        id: z.string().uuid().optional(),
        legalEntityId: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(120),
        code: z.string().trim().min(2).max(40),
        cnpj: z.string().trim().max(20).optional(),
        razaoSocial: z.string().trim().max(160).optional(),
        city: z.string().trim().max(100).optional(),
        state: z.string().trim().max(2).optional(),
        operationMode: z.enum(["salon", "school", "hybrid"]),
        ownershipModel: z.enum(["owned", "licensed", "franchised"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.organizationId || !["owner", "admin"].includes(ctx.user.role)) {
          throw new Error("Somente administradores podem gerenciar unidades");
        }

        const payload = {
          organization_id: ctx.user.organizationId,
          legal_entity_id: input.legalEntityId || null,
          name: input.name,
          code: input.code.toUpperCase().replace(/\s+/g, "-"),
          cnpj: input.cnpj || null,
          razao_social: input.razaoSocial || null,
          city: input.city || null,
          state: input.state?.toUpperCase() || null,
          operation_mode: input.operationMode,
          unit_type: input.operationMode,
          ownership_model: input.ownershipModel,
          status: "active",
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        if (input.id) {
          const { data, error } = await supabase
            .from("units")
            .update(payload)
            .eq("id", input.id)
            .eq("organization_id", ctx.user.organizationId)
            .select()
            .single();
          if (error) throw new Error(error.message);
          return data;
        }

        const { data: unit, error: unitError } = await supabase
          .from("units")
          .insert(payload)
          .select()
          .single();
        if (unitError || !unit) throw new Error(unitError?.message || "Erro ao criar unidade");

        const { error: accessError } = await supabase
          .from("user_unit_access")
          .insert({
            user_id: ctx.user.id,
            organization_id: ctx.user.organizationId,
            unit_id: unit.id,
            access_role: ctx.user.role,
            is_default: false,
            active: true,
          });
        if (accessError) {
          await supabase.from("units").delete().eq("id", unit.id);
          throw new Error(accessError.message);
        }

        return unit;
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
        return Promise.all((clientes || []).map(async (cliente: any) => {
          const pets = await attachPetPhotoUrls(cliente.pets || []);
          return {
            id: cliente.id,
            name: cliente.nome,
            email: cliente.email,
            phone: cliente.phone,
            cpf: cliente.cpf,
            cep: cliente.cep,
            logradouro: cliente.logradouro,
            numero: cliente.numero,
            complemento: cliente.complemento,
            bairro: cliente.bairro,
            cidade: cliente.cidade,
            uf: cliente.uf,
            isVip: cliente.is_vip,
            isModelDog: cliente.is_model_dog,
            status: cliente.status,
            pets: pets.map((pet: any) => ({
              ...pet,
              displayName: `${pet.name} (${cliente.nome})`,
            })),
          };
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
          const pets = await attachPetPhotoUrls(cliente.pets || []);
          return {
            id: cliente.id,
            name: cliente.nome,
            email: cliente.email,
            phone: cliente.phone,
            cpf: cliente.cpf,
            cep: cliente.cep,
            logradouro: cliente.logradouro,
            numero: cliente.numero,
            complemento: cliente.complemento,
            bairro: cliente.bairro,
            cidade: cliente.cidade,
            uf: cliente.uf,
            isVip: cliente.is_vip,
            isModelDog: cliente.is_model_dog,
            status: cliente.status,
            pets: pets.map((pet: any) => ({
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
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        isVip: z.boolean().default(false),
        isModelDog: z.boolean().default(false),
        pet: z.object({
          name: z.string().trim().min(1, "Nome do pet é obrigatório"),
          breed: z.string().trim().min(1, "Raça é obrigatória"),
          weight: z.string().trim().min(1, "Peso é obrigatório"),
          size: z.string().trim().optional(),
          species: z.string().trim().optional(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user?.organizationId || !ctx.user.unitId) {
            throw new Error("Selecione uma unidade ativa");
          }
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
              bairro: input.bairro || null,
              cidade: input.cidade || null,
              uf: input.uf || null,
              is_vip: input.isVip,
              is_model_dog: input.isModelDog,
            }])
            .select()
            .single();

          if (error) throw error;

          const addressProvided = Boolean(
            input.cep || input.logradouro || input.numero || input.complemento ||
            input.bairro || input.cidade || input.uf,
          );
          if (addressProvided) {
            const { error: addressError } = await supabase
              .from("client_addresses")
              .insert({
                organization_id: ctx.user.organizationId,
                unit_id: ctx.user.unitId,
                client_id: data.id,
                cep: input.cep || null,
                logradouro: input.logradouro || null,
                numero: input.numero || null,
                complemento: input.complemento || null,
                bairro: input.bairro || null,
                cidade: input.cidade || null,
                uf: input.uf || null,
              });
            if (addressError) {
              await supabase.from("clientes").delete().eq("id", data.id);
              throw addressError;
            }
          }

          let pet = null;
          if (input.pet) {
            const petCode = await generatePetCode();
            const { data: createdPet, error: petError } = await supabase
              .from("pets")
              .insert({
                id_pet: petCode,
                client_id: data.id,
                name: input.pet.name,
                breed: input.pet.breed,
                weight: input.pet.weight,
                size: input.pet.size || null,
                species: input.pet.species || "Cão",
                status: "active",
              })
              .select()
              .single();
            if (petError) {
              await supabase.from("clientes").delete().eq("id", data.id);
              throw petError;
            }
            pet = createdPet;
          }

          return { ...data, pet };
        } catch (error) {
          console.error("Error creating client:", error);
          throw new Error(error instanceof Error ? error.message : "Erro ao criar cliente");
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
        bairro: z.string().optional(),
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
              bairro: updateData.bairro || null,
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

          const { error: addressError } = await supabase
            .from("client_addresses")
            .upsert({
              organization_id: data.organization_id,
              unit_id: data.unit_id,
              client_id: data.id,
              label: "Principal",
              cep: updateData.cep || null,
              logradouro: updateData.logradouro || null,
              numero: updateData.numero || null,
              complemento: updateData.complemento || null,
              bairro: updateData.bairro || null,
              cidade: updateData.cidade || null,
              uf: updateData.uf || null,
              updated_at: new Date().toISOString(),
            }, { onConflict: "client_id,label" });
          if (addressError) throw addressError;
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
            .createSignedUrl(fileKey, 60 * 60);
          if (signedError) throw signedError;

          const { error: updateError } = await supabase
            .from("pets")
            .update({
              photo_storage_key: fileKey,
              photo: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", input.petId);
          if (updateError) {
            await supabaseAdmin.storage.from("pet-photos").remove([fileKey]);
            throw updateError;
          }

          return { url: signed.signedUrl, key: fileKey, success: true };
        } catch (error) {
          console.error("Error uploading pet photo:", error);
          throw new Error(error instanceof Error ? error.message : "Erro ao fazer upload da foto");
        }
      }),
  }),

  professionals: router({
    // List all professionals
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        if (!ctx.user?.unitId) throw new Error("Selecione uma unidade ativa");
        const { data: professionals, error } = await supabase
          .from("professionals")
          .select("*")
          .eq("unit_id", ctx.user.unitId)
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
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        specialization: z.string().optional(),
        roleTitle: z.string().optional(),
        hireDate: z.string().optional(),
        commissionPercent: z.number().min(0).max(100).optional(),
        notes: z.string().max(2000).optional(),
        status: z.enum(["active", "inactive", "vacation"]).default("active"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user?.organizationId || !ctx.user.unitId) throw new Error("Selecione uma unidade ativa");
          const { data, error } = await supabase
            .from("professionals")
            .insert([{
              organization_id: ctx.user.organizationId,
              unit_id: ctx.user.unitId,
              name: input.name,
              email: input.email || null,
              phone: input.phone || null,
              cpf: input.cpf || null,
              specialization: input.specialization || null,
              role_title: input.roleTitle || null,
              hire_date: input.hireDate || null,
              commission_percent: input.commissionPercent ?? 0,
              notes: input.notes || null,
              status: input.status,
              is_active: input.status === "active",
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
        roleTitle: z.string().optional(),
        hireDate: z.string().optional(),
        commissionPercent: z.number().min(0).max(100).optional(),
        notes: z.string().max(2000).optional(),
        status: z.enum(["active", "inactive", "vacation"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user?.unitId) throw new Error("Selecione uma unidade ativa");
          const { id, ...updateData } = input;
          const updatePayload: Record<string, any> = {};
          
          if (updateData.name) updatePayload.name = updateData.name;
          if (updateData.email !== undefined) updatePayload.email = updateData.email || null;
          if (updateData.phone !== undefined) updatePayload.phone = updateData.phone || null;
          if (updateData.cpf !== undefined) updatePayload.cpf = updateData.cpf || null;
          if (updateData.specialization !== undefined) updatePayload.specialization = updateData.specialization || null;
          if (updateData.roleTitle !== undefined) updatePayload.role_title = updateData.roleTitle || null;
          if (updateData.hireDate !== undefined) updatePayload.hire_date = updateData.hireDate || null;
          if (updateData.commissionPercent !== undefined) updatePayload.commission_percent = updateData.commissionPercent;
          if (updateData.notes !== undefined) updatePayload.notes = updateData.notes || null;
          if (updateData.status !== undefined) {
            updatePayload.status = updateData.status;
            updatePayload.is_active = updateData.status === "active";
          }
          updatePayload.updated_at = new Date().toISOString();

          const { data, error } = await supabase
            .from("professionals")
            .update(updatePayload)
            .eq("id", id)
            .eq("unit_id", ctx.user.unitId)
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
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user?.unitId) throw new Error("Selecione uma unidade ativa");
          const { error } = await supabase
            .from("professionals")
            .update({ status: "inactive", is_active: false, updated_at: new Date().toISOString() })
            .eq("id", input.id)
            .eq("unit_id", ctx.user.unitId);

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
        return (appointments || []).map((appointment: any) => ({
          ...appointment,
          appointmentDate: appointment.appointment_date,
          clientId: appointment.client_id,
          petId: appointment.pet_id,
          serviceId: appointment.service_id,
          professionalId: appointment.professional_id,
          clientPackageId: appointment.client_package_id,
          durationMinutes: appointment.duration_minutes,
        }));
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
    create: protectedProcedure
      .input(z.object({
        clientId: z.string().uuid(),
        petId: z.string().uuid(),
        serviceId: z.string().uuid(),
        professionalId: z.string().uuid(),
        clientPackageId: z.string().uuid().optional(),
        appointmentDate: z.string().datetime(),
        notes: z.string().trim().max(2000).optional(),
        recurrenceRule: z.enum(["none", "weekly", "biweekly", "monthly"]).default("none"),
        sendEmail: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user?.organizationId || !ctx.user.unitId) {
            throw new Error("Selecione uma unidade ativa antes de agendar");
          }

          // Validar que cliente, pet e serviço existem
          const [clientRes, petRes, serviceRes, profRes, packageRes] = await Promise.all([
            supabase.from("clientes").select("id, nome, email").eq("id", input.clientId).eq("unit_id", ctx.user.unitId).single(),
            supabase.from("pets").select("id, name, client_id").eq("id", input.petId).eq("unit_id", ctx.user.unitId).single(),
            supabase.from("services").select("id, name, price, duration_minutes").eq("id", input.serviceId).eq("unit_id", ctx.user.unitId).eq("status", "active").single(),
            supabase.from("professionals").select("id").eq("id", input.professionalId).eq("unit_id", ctx.user.unitId).eq("is_active", true).single(),
            input.clientPackageId
              ? supabase.from("client_packages").select("id, client_id, pet_id, status").eq("id", input.clientPackageId).eq("unit_id", ctx.user.unitId).single()
              : Promise.resolve({ data: null, error: null }),
          ]);

          if (!clientRes.data) throw new Error("Cliente não encontrado nesta unidade");
          if (!petRes.data) throw new Error("Pet não encontrado nesta unidade");
          if (petRes.data.client_id !== input.clientId) throw new Error("O pet não pertence ao cliente selecionado");
          if (!serviceRes.data) throw new Error("Serviço não disponível nesta unidade");
          if (!profRes.data) throw new Error("Profissional não disponível nesta unidade");
          if (input.clientPackageId && (!packageRes.data || packageRes.data.status !== "active")) throw new Error("Pacote não está ativo");
          if (packageRes.data && (packageRes.data.client_id !== input.clientId || packageRes.data.pet_id !== input.petId)) {
            throw new Error("O pacote não pertence ao cliente e pet selecionados");
          }

          const startsAt = new Date(input.appointmentDate);
          const durationMinutes = Number(serviceRes.data.duration_minutes || 60);
          const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
          const { data: possibleConflicts, error: conflictError } = await supabase
            .from("appointments")
            .select("id, appointment_date, duration_minutes")
            .eq("professional_id", input.professionalId)
            .eq("unit_id", ctx.user.unitId)
            .not("status", "in", '("completed","cancelled","no_show")')
            .gte("appointment_date", new Date(startsAt.getTime() - 12 * 60 * 60_000).toISOString())
            .lte("appointment_date", endsAt.toISOString());
          if (conflictError) throw conflictError;
          const hasConflict = (possibleConflicts ?? []).some((appointment) => {
            const existingStart = new Date(appointment.appointment_date);
            const existingEnd = new Date(existingStart.getTime() + Number(appointment.duration_minutes || 60) * 60_000);
            return startsAt < existingEnd && endsAt > existingStart;
          });
          if (hasConflict) throw new Error("O profissional já possui atendimento nesse horário");

          const formatTime = (date: Date) => date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Sao_Paulo",
          });

          const { data, error } = await supabase
            .from("appointments")
            .insert([{
              client_id: input.clientId,
              pet_id: input.petId,
              service_id: input.serviceId,
              professional_id: input.professionalId,
              client_package_id: input.clientPackageId || null,
              appointment_date: input.appointmentDate,
              start_time: formatTime(startsAt),
              end_time: formatTime(endsAt),
              duration_minutes: durationMinutes,
              total_price: Number(serviceRes.data.price || 0),
              recurrence_rule: input.recurrenceRule === "none" ? null : input.recurrenceRule,
              status: "pending",
              notes: input.notes || null,
              created_by: ctx.user.id,
            }])
            .select()
            .single();

          if (error) throw error;

          const { error: appointmentServiceError } = await supabase
            .from("appointment_services")
            .insert({
              appointment_id: data.id,
              service_id: input.serviceId,
              unit_price: Number(serviceRes.data.price || 0),
              duration_minutes: durationMinutes,
            });
          if (appointmentServiceError) {
            await supabase.from("appointments").delete().eq("id", data.id);
            throw appointmentServiceError;
          }

          // Enviar email se solicitado
          if (input.sendEmail && clientRes.data.email) {
            try {
              await sendAppointmentConfirmationEmail(
                clientRes.data.email,
                clientRes.data.nome,
                petRes.data.name,
                serviceRes.data.name,
                input.appointmentDate,
                formatTime(startsAt),
              );
            } catch (emailError) {
              console.error("Erro ao enviar email:", emailError);
              // Não lançar erro se o email falhar
            }
          }

          return data;
        } catch (error) {
          console.error("Error creating appointment:", error);
          throw new Error(error instanceof Error ? error.message : "Erro ao criar agendamento");
        }
      }),

    setStatus: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        status: z.enum(["confirmed", "in_progress", "completed", "cancelled", "no_show"]),
        reason: z.string().trim().max(500).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
        if (["cancelled", "no_show"].includes(input.status) && !input.reason) {
          throw new Error("Informe o motivo");
        }

        const { data: current, error: currentError } = await supabase
          .from("appointments")
          .select("id, status")
          .eq("id", input.id)
          .eq("unit_id", ctx.user.unitId)
          .single();
        if (currentError || !current) throw new Error("Agendamento não encontrado");

        const transitions: Record<string, string[]> = {
          pending: ["confirmed", "cancelled", "no_show"],
          confirmed: ["in_progress", "cancelled", "no_show"],
          in_progress: ["completed", "cancelled"],
          completed: [],
          cancelled: [],
          no_show: [],
        };
        if (!transitions[current.status]?.includes(input.status)) {
          throw new Error("Mudança de status não permitida");
        }

        if (input.status === "completed") {
          const { data, error } = await supabase.rpc("complete_appointment", {
            p_appointment_id: input.id,
          });
          if (error) throw new Error(error.message);
          return data;
        }

        const now = new Date().toISOString();
        const timestampColumn: Record<string, string> = {
          confirmed: "confirmed_at",
          in_progress: "started_at",
          completed: "completed_at",
          cancelled: "cancelled_at",
        };
        const changes: Record<string, unknown> = {
          status: input.status,
          cancellation_reason: input.reason || null,
          updated_at: now,
        };
        if (timestampColumn[input.status]) changes[timestampColumn[input.status]] = now;

        const { data, error } = await supabase
          .from("appointments")
          .update(changes)
          .eq("id", input.id)
          .eq("unit_id", ctx.user.unitId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }),

    // Update an appointment
    update: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        clientId: z.string().uuid(),
        petId: z.string().uuid(),
        serviceId: z.string().uuid(),
        professionalId: z.string().uuid(),
        clientPackageId: z.string().uuid().nullable().optional(),
        appointmentDate: z.string().datetime(),
        recurrenceRule: z.enum(["none", "weekly", "biweekly", "monthly"]).default("none"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
          const [clientRes, petRes, serviceRes, professionalRes, packageRes] = await Promise.all([
            supabase.from("clientes").select("id").eq("id", input.clientId).eq("unit_id", ctx.user.unitId).single(),
            supabase.from("pets").select("id, client_id").eq("id", input.petId).eq("unit_id", ctx.user.unitId).single(),
            supabase.from("services").select("id, price, duration_minutes").eq("id", input.serviceId).eq("unit_id", ctx.user.unitId).eq("status", "active").single(),
            supabase.from("professionals").select("id").eq("id", input.professionalId).eq("unit_id", ctx.user.unitId).eq("is_active", true).single(),
            input.clientPackageId
              ? supabase.from("client_packages").select("id, client_id, pet_id, status").eq("id", input.clientPackageId).eq("unit_id", ctx.user.unitId).single()
              : Promise.resolve({ data: null, error: null }),
          ]);
          if (!clientRes.data || !petRes.data || !serviceRes.data || !professionalRes.data) {
            throw new Error("Cliente, pet, serviço ou profissional não está disponível nesta unidade");
          }
          if (petRes.data.client_id !== input.clientId) throw new Error("O pet não pertence ao tutor selecionado");
          if (input.clientPackageId && (!packageRes.data || packageRes.data.status !== "active")) throw new Error("Pacote não está ativo");
          if (packageRes.data && (packageRes.data.client_id !== input.clientId || packageRes.data.pet_id !== input.petId)) {
            throw new Error("O pacote não pertence ao tutor e pet selecionados");
          }

          const startsAt = new Date(input.appointmentDate);
          const durationMinutes = Number(serviceRes.data.duration_minutes || 60);
          const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
          const { data: possibleConflicts, error: conflictError } = await supabase
            .from("appointments")
            .select("id, appointment_date, duration_minutes")
            .eq("professional_id", input.professionalId)
            .eq("unit_id", ctx.user.unitId)
            .neq("id", input.id)
            .not("status", "in", '("completed","cancelled","no_show")')
            .gte("appointment_date", new Date(startsAt.getTime() - 12 * 60 * 60_000).toISOString())
            .lte("appointment_date", endsAt.toISOString());
          if (conflictError) throw conflictError;
          const hasConflict = (possibleConflicts ?? []).some((appointment) => {
            const existingStart = new Date(appointment.appointment_date);
            const existingEnd = new Date(existingStart.getTime() + Number(appointment.duration_minutes || 60) * 60_000);
            return startsAt < existingEnd && endsAt > existingStart;
          });
          if (hasConflict) throw new Error("O profissional já possui atendimento nesse horário");
          const formatTime = (date: Date) => date.toLocaleTimeString("pt-BR", {
            hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Sao_Paulo",
          });
          const updateData = {
            client_id: input.clientId,
            pet_id: input.petId,
            service_id: input.serviceId,
            professional_id: input.professionalId,
            client_package_id: input.clientPackageId || null,
            appointment_date: input.appointmentDate,
            start_time: formatTime(startsAt),
            end_time: formatTime(endsAt),
            duration_minutes: durationMinutes,
            total_price: Number(serviceRes.data.price || 0),
            recurrence_rule: input.recurrenceRule === "none" ? null : input.recurrenceRule,
            notes: input.notes || null,
            updated_at: new Date().toISOString(),
          };

          const { data, error } = await supabase
            .from("appointments")
            .update(updateData)
            .eq("id", input.id)
            .eq("unit_id", ctx.user.unitId)
            .select()
            .single();

          if (error) throw error;

          const { error: appointmentServiceError } = await supabase
            .from("appointment_services")
            .update({
              service_id: input.serviceId,
              unit_price: Number(serviceRes.data.price || 0),
              duration_minutes: durationMinutes,
            })
            .eq("appointment_id", input.id);
          if (appointmentServiceError) throw appointmentServiceError;

          return data;
        } catch (error) {
          console.error("Error updating appointment:", error);
          throw new Error(error instanceof Error ? error.message : "Erro ao atualizar agendamento");
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
        return (services || []).map((service) => ({
          ...service,
          durationMinutes: service.duration_minutes,
        }));
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
          return service
            ? { ...service, durationMinutes: service.duration_minutes }
            : null;
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

  scheduleSimulator: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
      const { data, error } = await supabase
        .from("schedule_simulations")
        .select("*, client:client_id(nome, phone), pet:pet_id(name, breed), service:service_id(name), professional:professional_id(name), client_package:client_package_id(code)")
        .eq("unit_id", ctx.user.unitId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return data ?? [];
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user?.organizationId || !ctx.user.unitId) throw new Error("Unidade ativa não encontrada");
        const { data, error } = await supabase
          .from("schedule_simulations")
          .select("*, items:schedule_simulation_items(*), client:client_id(nome, phone), pet:pet_id(name, breed), service:service_id(name), professional:professional_id(name), client_package:client_package_id(code)")
          .eq("id", input.id)
          .eq("unit_id", ctx.user.unitId)
          .single();
        if (error) throw new Error(error.message);
        return data;
      }),

    simulate: protectedProcedure
      .input(z.object({
        clientId: z.string().uuid(),
        petId: z.string().uuid(),
        appointmentType: z.enum(["package", "standalone"]).default("standalone"),
        clientPackageId: z.string().uuid().optional(),
        serviceId: z.string().uuid(),
        professionalId: z.string().uuid(),
        frequency: z.enum(["weekly", "biweekly", "every_21_days", "monthly", "once"]),
        startDate: z.string().date(),
        endDate: z.string().date().optional(),
        defaultTime: z.string().regex(/^\d{2}:\d{2}$/),
        quantity: z.number().int().min(1).max(60),
        petType: z.string().max(120).optional(),
        serviceMode: z.string().max(80).optional(),
        groomingQuantity: z.number().int().min(0).max(60).default(0),
        groomingIntervalWeeks: z.number().int().min(1).max(16).default(8),
        paymentActivationDate: z.string().date().optional(),
        lastIncludedDate: z.string().date().optional(),
        nextRenewalDate: z.string().date().optional(),
        standardWeekday: z.number().int().min(0).max(6).optional(),
        recurrenceRuleMode: z.enum(["standard_weekday", "exact_interval"]).default("standard_weekday"),
        referenceDate: z.string().date().optional(),
        cycleStartDate: z.string().date().optional(),
        finalServiceName: z.string().max(180).optional(),
        notes: z.string().max(2000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.organizationId || !ctx.user.unitId) throw new Error("Unidade ativa não encontrada");
        const [clientRes, petRes, serviceRes, professionalRes, packageRes] = await Promise.all([
          supabase.from("clientes").select("id, nome, phone").eq("id", input.clientId).eq("unit_id", ctx.user.unitId).single(),
          supabase.from("pets").select("id, name, breed, client_id").eq("id", input.petId).eq("unit_id", ctx.user.unitId).single(),
          supabase.from("services").select("id, name, duration_minutes, price, category").eq("id", input.serviceId).eq("unit_id", ctx.user.unitId).eq("status", "active").single(),
          supabase.from("professionals").select("id, name").eq("id", input.professionalId).eq("unit_id", ctx.user.unitId).eq("is_active", true).single(),
          input.clientPackageId
            ? supabase.from("client_packages").select("*, plan:package_id(name, code)").eq("id", input.clientPackageId).eq("unit_id", ctx.user.unitId).single()
            : Promise.resolve({ data: null, error: null }),
        ]);
        if (!clientRes.data || !petRes.data || petRes.data.client_id !== input.clientId) throw new Error("Cliente ou pet inválido");
        if (!serviceRes.data || !professionalRes.data) throw new Error("Serviço ou profissional indisponível");
        if (input.clientPackageId && (!packageRes.data || packageRes.data.pet_id !== input.petId || packageRes.data.status !== "active")) {
          throw new Error("O pacote selecionado não está vigente para este pet");
        }
        const serviceText = `${serviceRes.data.category || ""} ${serviceRes.data.name || ""}`.toLowerCase();
        const consumesGrooming = serviceText.includes("tosa") || serviceText.includes("trimming");
        let selectedPackage: any = packageRes.data;
        if (input.appointmentType === "package" && !selectedPackage) {
          const { data: candidates, error: candidatesError } = await supabase
            .from("client_packages")
            .select("*, plan:package_id(name, code)")
            .eq("unit_id", ctx.user.unitId)
            .eq("pet_id", input.petId)
            .eq("status", "active")
            .order("expiry_date", { ascending: true, nullsFirst: false });
          if (candidatesError) throw candidatesError;
          selectedPackage = (candidates ?? []).find((item: any) => {
            const withinValidity = !item.expiry_date || item.expiry_date >= input.startDate;
            const hasBalance = Number(consumesGrooming ? item.balance_groomings : item.balance_baths) > 0;
            return withinValidity && hasBalance;
          });
          if (!selectedPackage) throw new Error("Pet sem pacote vigente e com saldo para este serviço");
        }

        const intervalDays: Record<string, number> = { weekly: 7, biweekly: 14, every_21_days: 21, once: 0 };
        const dates: Date[] = [];
        const baseDate = input.referenceDate || input.startDate;
        let cursor = new Date(`${baseDate}T${input.defaultTime}:00-03:00`);
        if (input.recurrenceRuleMode === "standard_weekday" && input.standardWeekday !== undefined) {
          const distance = (input.standardWeekday - cursor.getDay() + 7) % 7;
          cursor.setDate(cursor.getDate() + distance);
        }
        const resolvedStandardWeekday = input.standardWeekday ?? cursor.getDay();
        const limit = input.endDate ? new Date(`${input.endDate}T23:59:59-03:00`) : null;
        for (let index = 0; index < input.quantity; index += 1) {
          if (limit && cursor > limit) break;
          dates.push(new Date(cursor));
          if (input.frequency === "monthly") cursor.setMonth(cursor.getMonth() + 1);
          else if (input.frequency === "once") break;
          else cursor.setDate(cursor.getDate() + intervalDays[input.frequency]);
        }
        if (!dates.length) throw new Error("Nenhuma data foi gerada dentro da vigência informada");

        const rangeStart = dates[0].toISOString();
        const rangeEnd = new Date(dates[dates.length - 1].getTime() + 24 * 60 * 60_000).toISOString();
        const { data: existing, error: existingError } = await supabase
          .from("appointments")
          .select("id, pet_id, professional_id, appointment_date, duration_minutes, status")
          .eq("unit_id", ctx.user.unitId)
          .not("status", "in", '("cancelled","no_show")')
          .gte("appointment_date", rangeStart)
          .lte("appointment_date", rangeEnd);
        if (existingError) throw existingError;

        const availableBalance = selectedPackage
          ? Number(consumesGrooming ? selectedPackage.balance_groomings : selectedPackage.balance_baths)
          : null;
        const duration = Number(serviceRes.data.duration_minutes || 60);
        const items = dates.map((scheduledAt, index) => {
          const alerts: string[] = [];
          if (selectedPackage?.expiry_date && scheduledAt > new Date(`${selectedPackage.expiry_date}T23:59:59-03:00`)) alerts.push("Data fora da vigência do pacote");
          if (availableBalance !== null && index >= availableBalance) alerts.push("Quantidade maior que o saldo disponível");
          const scheduledEnd = new Date(scheduledAt.getTime() + duration * 60_000);
          for (const appointment of existing ?? []) {
            const existingStart = new Date(appointment.appointment_date);
            const existingEnd = new Date(existingStart.getTime() + Number(appointment.duration_minutes || 60) * 60_000);
            if (appointment.pet_id === input.petId && existingStart.getTime() === scheduledAt.getTime()) alerts.push("Pet já possui atendimento nesta data e horário");
            if (appointment.professional_id === input.professionalId && scheduledAt < existingEnd && scheduledEnd > existingStart) alerts.push("Profissional indisponível neste horário");
          }
          return {
            scheduled_at: scheduledAt.toISOString(),
            client_package_id: selectedPackage?.id || null,
            status: alerts.some((alert) => alert.includes("possui") || alert.includes("indisponível")) ? "conflict" : alerts.length ? "warning" : "valid",
            alerts: Array.from(new Set(alerts)),
          };
        });

        const finalServiceName = input.finalServiceName || serviceRes.data.name;
        const groomingIndexes = new Set<number>();
        if (input.groomingQuantity > 0) {
          const firstDate = dates[0];
          let groomingCount = 0;
          dates.forEach((date, index) => {
            const weeksFromStart = Math.round((date.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60_000));
            if (weeksFromStart >= groomingCount * input.groomingIntervalWeeks && groomingCount < input.groomingQuantity) {
              groomingIndexes.add(index);
              groomingCount += 1;
            }
          });
        }
        const serviceNameForIndex = (index: number) => groomingIndexes.has(index)
          ? `${finalServiceName} + Tosa/Trimming`
          : finalServiceName;
        const planName = selectedPackage?.plan?.name || selectedPackage?.plan_name || selectedPackage?.plan?.code || selectedPackage?.plan_code || selectedPackage?.code || "Avulso";
        const groomingLine = input.groomingQuantity > 0
          ? `Tosas/Trimming inclusos: ${input.groomingQuantity} atendimento(s)\n`
          : "";
        const message = `Olá, ${clientRes.data.nome}! Confirmamos a assinatura do Termo de Adesão e a confirmação do pagamento.\nO plano do ${petRes.data.name} está ativo.\n\nPlano contratado:\n- ${planName}\nFrequência: ${input.frequency === "weekly" ? "Semanal" : input.frequency === "biweekly" ? "Quinzenal" : input.frequency === "monthly" ? "Mensal" : input.frequency === "every_21_days" ? "A cada 21 dias" : "Atendimento único"}\nData de ativação/pagamento: ${new Date(`${input.paymentActivationDate || input.startDate}T00:00:00-03:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}\nInício do ciclo de utilização: ${new Date(`${input.cycleStartDate || input.startDate}T00:00:00-03:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}\nAtendimentos inclusos: ${items.length} atendimento(s)\n${groomingLine}${input.nextRenewalDate ? `Próxima renovação/cobrança: ${new Date(`${input.nextRenewalDate}T00:00:00-03:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n` : ""}\nPara facilitar a organização da agenda, deixamos abaixo a previsão de atendimentos do ciclo atual:\n\n${items.map((item, index) => `${index + 1}. ${new Date(item.scheduled_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} às ${input.defaultTime} — ${serviceNameForIndex(index)}`).join("\n")}\n\nObrigada pela confiança na Lux Dog!`;
        const { data: simulation, error: simulationError } = await supabase.from("schedule_simulations").insert({
          organization_id: ctx.user.organizationId,
          unit_id: ctx.user.unitId,
          client_id: input.clientId,
          pet_id: input.petId,
          client_package_id: selectedPackage?.id || null,
          appointment_type: input.appointmentType,
          service_id: input.serviceId,
          professional_id: input.professionalId,
          frequency: input.frequency,
          start_date: input.startDate,
          end_date: input.endDate || null,
          default_time: input.defaultTime,
          quantity: items.length,
          pet_type: input.petType || petRes.data.breed || null,
          service_mode: input.serviceMode || null,
          grooming_quantity: input.groomingQuantity,
          grooming_interval_weeks: input.groomingIntervalWeeks,
          payment_activation_date: input.paymentActivationDate || input.startDate,
          last_included_date: input.lastIncludedDate || null,
          next_renewal_date: input.nextRenewalDate || null,
          standard_weekday: resolvedStandardWeekday,
          recurrence_rule_mode: input.recurrenceRuleMode,
          reference_date: input.referenceDate || input.startDate,
          cycle_start_date: input.cycleStartDate || input.startDate,
          final_service_name: finalServiceName,
          notes: input.notes || null,
          message_text: message,
          created_by: ctx.user.id,
        }).select().single();
        if (simulationError) throw new Error(simulationError.message);
        const { data: savedItems, error: itemsError } = await supabase.from("schedule_simulation_items")
          .insert(items.map((item, index) => ({
            ...item,
            simulation_id: simulation.id,
            include_grooming: groomingIndexes.has(index),
            final_service_name: serviceNameForIndex(index),
          })))
          .select();
        if (itemsError) {
          await supabase.from("schedule_simulations").delete().eq("id", simulation.id);
          throw new Error(itemsError.message);
        }
        return { ...simulation, items: savedItems ?? [], message_text: message };
      }),

    updateItem: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        scheduledAt: z.string().datetime().optional(),
        ignored: z.boolean().optional(),
        includeGrooming: z.boolean().optional(),
        finalServiceName: z.string().max(180).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
        const { data: current, error: currentError } = await supabase
          .from("schedule_simulation_items")
          .select("*, simulation:simulation_id(*, service:service_id(duration_minutes), client_package:client_package_id(expiry_date, balance_baths, balance_groomings))")
          .eq("id", input.id)
          .single();
        if (currentError || !current?.simulation) throw new Error("Item da simulação não encontrado");
        if (input.ignored) {
          const { data, error } = await supabase.from("schedule_simulation_items")
            .update({ status: "ignored" }).eq("id", input.id).select().single();
          if (error) throw new Error(error.message);
          return data;
        }
        const simulation = current.simulation;
        const scheduledAt = new Date(input.scheduledAt || current.scheduled_at);
        const duration = Number(simulation.service?.duration_minutes || 60);
        const scheduledEnd = new Date(scheduledAt.getTime() + duration * 60_000);
        const alerts: string[] = [];
        if (simulation.client_package?.expiry_date && scheduledAt > new Date(`${simulation.client_package.expiry_date}T23:59:59-03:00`)) {
          alerts.push("Data fora da vigência do pacote");
        }
        const { data: existing, error: existingError } = await supabase
          .from("appointments")
          .select("pet_id, professional_id, appointment_date, duration_minutes")
          .eq("unit_id", ctx.user.unitId)
          .not("status", "in", '("cancelled","no_show")')
          .gte("appointment_date", new Date(scheduledAt.getTime() - 12 * 60 * 60_000).toISOString())
          .lte("appointment_date", scheduledEnd.toISOString());
        if (existingError) throw existingError;
        for (const appointment of existing ?? []) {
          const existingStart = new Date(appointment.appointment_date);
          const existingEnd = new Date(existingStart.getTime() + Number(appointment.duration_minutes || 60) * 60_000);
          if (appointment.pet_id === simulation.pet_id && existingStart.getTime() === scheduledAt.getTime()) alerts.push("Pet já possui atendimento nesta data e horário");
          if (appointment.professional_id === simulation.professional_id && scheduledAt < existingEnd && scheduledEnd > existingStart) alerts.push("Profissional indisponível neste horário");
        }
        const status = alerts.some((alert) => alert.includes("possui") || alert.includes("indisponível"))
          ? "conflict"
          : alerts.length ? "warning" : "valid";
        const { data, error } = await supabase.from("schedule_simulation_items").update({
          scheduled_at: scheduledAt.toISOString(),
          status,
          alerts: Array.from(new Set(alerts)),
          ...(input.includeGrooming !== undefined ? { include_grooming: input.includeGrooming } : {}),
          ...(input.finalServiceName !== undefined ? { final_service_name: input.finalServiceName || null } : {}),
        }).eq("id", input.id).select().single();
        if (error) throw new Error(error.message);
        return data;
      }),

    confirm: protectedProcedure
      .input(z.object({ id: z.string().uuid(), includeWarnings: z.boolean().default(true) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.organizationId || !ctx.user.unitId) throw new Error("Unidade ativa não encontrada");
        const { data: simulation, error } = await supabase
          .from("schedule_simulations")
          .select("*, items:schedule_simulation_items(*)")
          .eq("id", input.id)
          .eq("unit_id", ctx.user.unitId)
          .eq("status", "draft")
          .single();
        if (error || !simulation) throw new Error("Simulação não encontrada ou já confirmada");
        const selectedItems = (simulation.items ?? []).filter((item: any) =>
          item.status === "valid" || (input.includeWarnings && item.status === "warning"),
        );
        if (!selectedItems.length) throw new Error("Não há datas válidas para incluir");
        const { data: service } = await supabase.from("services").select("price, duration_minutes").eq("id", simulation.service_id).single();
        const duration = Number(service?.duration_minutes || 60);
        const starts = selectedItems.map((item: any) => new Date(item.scheduled_at));
        const rangeStart = new Date(Math.min(...starts.map((date: Date) => date.getTime())) - 12 * 60 * 60_000).toISOString();
        const rangeEnd = new Date(Math.max(...starts.map((date: Date) => date.getTime())) + duration * 60_000).toISOString();
        const { data: currentAppointments, error: validationError } = await supabase
          .from("appointments")
          .select("pet_id, professional_id, appointment_date, duration_minutes")
          .eq("unit_id", ctx.user.unitId)
          .not("status", "in", '("cancelled","no_show")')
          .gte("appointment_date", rangeStart)
          .lte("appointment_date", rangeEnd);
        if (validationError) throw validationError;
        for (const item of selectedItems) {
          const newStart = new Date(item.scheduled_at);
          const newEnd = new Date(newStart.getTime() + duration * 60_000);
          const conflict = (currentAppointments ?? []).some((appointment: any) => {
            const existingStart = new Date(appointment.appointment_date);
            const existingEnd = new Date(existingStart.getTime() + Number(appointment.duration_minutes || 60) * 60_000);
            return (
              (appointment.pet_id === simulation.pet_id && existingStart.getTime() === newStart.getTime()) ||
              (appointment.professional_id === simulation.professional_id && newStart < existingEnd && newEnd > existingStart)
            );
          });
          if (conflict) throw new Error("A agenda mudou após a simulação. Revise os conflitos antes de confirmar.");
        }
        const appointmentsPayload = selectedItems.map((item: any) => {
          const startsAt = new Date(item.scheduled_at);
          const endsAt = new Date(startsAt.getTime() + duration * 60_000);
          return {
            organization_id: ctx.user!.organizationId,
            unit_id: ctx.user!.unitId,
            client_id: simulation.client_id,
            pet_id: simulation.pet_id,
            service_id: simulation.service_id,
            professional_id: simulation.professional_id,
            client_package_id: item.client_package_id,
            appointment_type: simulation.appointment_type,
            appointment_date: item.scheduled_at,
            start_time: startsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }),
            end_time: endsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }),
            duration_minutes: duration,
            total_price: Number(service?.price || 0),
            recurrence_rule: simulation.frequency,
            status: "pending",
            notes: simulation.notes,
            created_by: ctx.user!.id,
          };
        });
        const { data: created, error: createError } = await supabase.from("appointments").insert(appointmentsPayload).select();
        if (createError) throw new Error(createError.message);
        const appointmentServices = (created ?? []).map((appointment: any) => ({
          appointment_id: appointment.id,
          service_id: simulation.service_id,
          unit_price: Number(service?.price || 0),
          duration_minutes: duration,
        }));
        const { error: servicesError } = await supabase.from("appointment_services").insert(appointmentServices);
        if (servicesError) {
          await supabase.from("appointments").delete().in("id", (created ?? []).map((item: any) => item.id));
          throw new Error(servicesError.message);
        }
        await Promise.all((created ?? []).map((appointment: any, index: number) =>
          supabase.from("schedule_simulation_items").update({ status: "created", appointment_id: appointment.id }).eq("id", selectedItems[index].id),
        ));
        await supabase.from("schedule_simulations").update({ status: "confirmed", confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", input.id);
        return { created: created?.length ?? 0 };
      }),

    saveMessage: protectedProcedure
      .input(z.object({ id: z.string().uuid(), content: z.string().trim().min(1).max(10000) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.organizationId || !ctx.user.unitId) throw new Error("Unidade ativa não encontrada");
        const { data: simulation } = await supabase.from("schedule_simulations").select("client_id, pet_id, client_package_id").eq("id", input.id).eq("unit_id", ctx.user.unitId).single();
        if (!simulation) throw new Error("Simulação não encontrada");
        await supabase.from("schedule_simulations").update({ message_text: input.content, updated_at: new Date().toISOString() }).eq("id", input.id);
        const { data, error } = await supabase.from("communication_history").insert({
          organization_id: ctx.user.organizationId,
          unit_id: ctx.user.unitId,
          client_id: simulation.client_id,
          pet_id: simulation.pet_id,
          client_package_id: simulation.client_package_id,
          simulation_id: input.id,
          channel: "whatsapp",
          content: input.content,
          status: "generated",
          created_by: ctx.user.id,
        }).select().single();
        if (error) throw new Error(error.message);
        return data;
      }),
  }),

  visits: router({
    byPet: protectedProcedure
      .input(z.object({ petId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
        const { data, error } = await supabase
          .from("visit_history")
          .select("*, service:service_id(name), professional:professional_id(name), client_package:client_package_id(code, plan:package_id(name))")
          .eq("unit_id", ctx.user.unitId)
          .eq("pet_id", input.petId)
          .order("visited_at", { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((visit: any) => ({
          id: visit.id,
          date: visit.visited_at,
          service: visit.service?.name || "Serviço",
          professional: visit.professional?.name || "Não informado",
          status: "completed" as const,
          notes: visit.notes || undefined,
          packageId: visit.client_package_id || undefined,
          packageName: visit.client_package?.plan?.name || visit.client_package?.code || undefined,
        }));
      }),
  }),

  clientPackages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
      const { data, error } = await supabase
        .from("client_packages")
        .select("*, client:client_id(nome, id_cliente), pet:pet_id(name, breed, id_pet), plan:package_id(name, code)")
        .eq("unit_id", ctx.user.unitId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((item: any) => ({
        ...item,
        id_package: item.code,
        pet_name: item.pet?.name,
        pet_breed: item.pet?.breed,
        client_name: item.client?.nome,
        id_pet: item.pet?.id_pet,
        id_client: item.client?.id_cliente,
        plan_name: item.plan?.name || "Pacote personalizado",
        plan_code: item.plan?.code || null,
        total_baths: item.contracted_baths,
        total_groomings: item.contracted_groomings,
        value: Number(item.price || 0),
        frequency: item.frequency || "weekly",
        payment_status: item.payment_status || "pending",
        consumed_baths: Math.max(0, Number(item.contracted_baths) - Number(item.balance_baths)),
        consumed_groomings: Math.max(0, Number(item.contracted_groomings) - Number(item.balance_groomings)),
        days_to_expiry: item.expiry_date
          ? Math.ceil((new Date(`${item.expiry_date}T23:59:59`).getTime() - Date.now()) / 86400000)
          : null,
        operational_status: item.status === "cancelled"
          ? "cancelled"
          : Number(item.balance_baths) + Number(item.balance_groomings) <= 0
            ? "consumed"
            : item.expiry_date && new Date(`${item.expiry_date}T23:59:59`).getTime() < Date.now()
              ? "expired"
              : item.expiry_date && new Date(`${item.expiry_date}T23:59:59`).getTime() - Date.now() <= 7 * 86400000
                ? "expiring"
                : item.status,
      }));
    }),
    byClient: protectedProcedure
      .input(z.object({ clientId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
        const { data, error } = await supabase
          .from("client_packages")
          .select("*, plan:package_id(name)")
          .eq("unit_id", ctx.user.unitId)
          .eq("client_id", input.clientId)
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return data ?? [];
      }),
    create: protectedProcedure
      .input(z.object({
        clientId: z.string().uuid(),
        petId: z.string().uuid(),
        packageId: z.string().uuid().optional(),
        baths: z.number().int().min(0),
        groomings: z.number().int().min(0),
        price: z.number().min(0),
        contractDate: z.string().date().optional(),
        expiryDate: z.string().optional(),
        frequency: z.enum(["weekly", "biweekly", "every_21_days", "monthly", "custom"]).default("weekly"),
        paymentStatus: z.enum(["pending", "paid", "waived"]).default("pending"),
        paymentDate: z.string().date().optional(),
        paymentMethod: z.string().trim().max(80).optional(),
        notes: z.string().max(1000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.organizationId || !ctx.user.unitId) throw new Error("Unidade ativa não encontrada");
        const { data: plan, error: planError } = input.packageId
          ? await supabase.from("packages").select("*").eq("id", input.packageId).eq("unit_id", ctx.user.unitId).eq("status", "active").single()
          : { data: null, error: null };
        if (input.packageId && (planError || !plan)) throw new Error("Plano de referência não encontrado ou inativo");
        const baths = plan ? Number(plan.total_baths) : input.baths;
        const groomings = plan ? Number(plan.total_groomings) : input.groomings;
        const price = plan ? Number(plan.total_price) : input.price;
        if (baths + groomings < 1) throw new Error("Informe ao menos um serviço no pacote");
        const contractDate = input.contractDate || new Date().toISOString().slice(0, 10);
        let expiryDate = input.expiryDate || null;
        if (plan?.duration_months && !expiryDate) {
          const expiry = new Date(`${contractDate}T12:00:00-03:00`);
          expiry.setMonth(expiry.getMonth() + Number(plan.duration_months));
          expiryDate = expiry.toISOString().slice(0, 10);
        }
        const { data: code, error: codeError } = await supabase.rpc("next_client_package_code", {
          p_organization_id: ctx.user.organizationId,
        });
        if (codeError || !code) throw new Error("Não foi possível gerar o código sequencial do pacote");
        const { data, error } = await supabase.from("client_packages").insert({
          organization_id: ctx.user.organizationId,
          unit_id: ctx.user.unitId,
          client_id: input.clientId,
          pet_id: input.petId,
          package_id: input.packageId || null,
          code,
          contracted_baths: baths,
          contracted_groomings: groomings,
          balance_baths: baths,
          balance_groomings: groomings,
          price,
          contract_date: contractDate,
          expiry_date: expiryDate,
          frequency: input.frequency,
          payment_status: input.paymentStatus,
          payment_date: input.paymentStatus === "paid" ? (input.paymentDate || contractDate) : null,
          payment_method: input.paymentMethod || null,
          notes: input.notes || null,
        }).select().single();
        if (error) throw new Error(error.message);
        return data;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        price: z.number().min(0).optional(),
        contractDate: z.string().date().optional(),
        expiryDate: z.string().date().nullable().optional(),
        notes: z.string().max(1000).nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
        const { id, contractDate, expiryDate, ...rest } = input;
        const changes: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
        if (contractDate !== undefined) changes.contract_date = contractDate;
        if (expiryDate !== undefined) changes.expiry_date = expiryDate;
        const { data, error } = await supabase.from("client_packages").update(changes)
          .eq("id", id).eq("unit_id", ctx.user.unitId).select().single();
        if (error) throw new Error(error.message);
        return data;
      }),
    cancel: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
        const { data, error } = await supabase.from("client_packages")
          .update({ status: "cancelled", payment_status: "refunded", updated_at: new Date().toISOString() })
          .eq("id", input.id).eq("unit_id", ctx.user.unitId).select().single();
        if (error) throw new Error(error.message);
        return data;
      }),
    renew: protectedProcedure
      .input(z.object({ id: z.string().uuid(), contractDate: z.string().date().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.organizationId || !ctx.user.unitId) throw new Error("Unidade ativa não encontrada");
        const { data: current, error: currentError } = await supabase.from("client_packages")
          .select("*, plan:package_id(duration_months)")
          .eq("id", input.id).eq("unit_id", ctx.user.unitId).single();
        if (currentError || !current) throw new Error("Pacote não encontrado");
        const contractDate = input.contractDate || new Date().toISOString().slice(0, 10);
        let expiryDate: string | null = null;
        if (current.plan?.duration_months) {
          const expiry = new Date(`${contractDate}T12:00:00-03:00`);
          expiry.setMonth(expiry.getMonth() + Number(current.plan.duration_months));
          expiryDate = expiry.toISOString().slice(0, 10);
        }
        const { data: code, error: codeError } = await supabase.rpc("next_client_package_code", {
          p_organization_id: ctx.user.organizationId,
        });
        if (codeError || !code) throw new Error("Não foi possível gerar o código da renovação");
        const { data: renewed, error: renewError } = await supabase.from("client_packages").insert({
          organization_id: ctx.user.organizationId,
          unit_id: ctx.user.unitId,
          client_id: current.client_id,
          pet_id: current.pet_id,
          package_id: current.package_id,
          code,
          contracted_baths: current.contracted_baths,
          contracted_groomings: current.contracted_groomings,
          balance_baths: current.contracted_baths,
          balance_groomings: current.contracted_groomings,
          price: current.price,
          contract_date: contractDate,
          expiry_date: expiryDate,
          status: "active",
          frequency: current.frequency || "weekly",
          payment_status: "pending",
          payment_date: null,
          payment_method: null,
          notes: current.notes,
        }).select().single();
        if (renewError) throw new Error(renewError.message);
        const { error: closeError } = await supabase.from("client_packages")
          .update({ status: "inactive", updated_at: new Date().toISOString() })
          .eq("id", current.id).eq("unit_id", ctx.user.unitId);
        if (closeError) throw new Error(closeError.message);
        return renewed;
      }),
  }),

  packages: router({
    // List all packages
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
        const { data: packages, error } = await supabase
          .from("packages")
          .select("*")
          .eq("unit_id", ctx.user.unitId)
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
        audienceCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,8}$/, "Use de 2 a 8 letras ou números no código da raça/categoria"),
        durationMonths: z.number().int().min(1).max(60),
        totalBaths: z.number().min(0, "Qtd de banhos deve ser >= 0"),
        totalGroomings: z.number().min(0, "Qtd de tosas deve ser >= 0"),
        totalPrice: z.number().min(0, "Valor total deve ser > 0"),
        monthlyPrice: z.number().min(0, "Valor mensal deve ser >= 0").optional(),
        recurrenceType: z.string().optional(),
        status: z.string().default("active"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user?.organizationId || !ctx.user.unitId) throw new Error("Unidade ativa não encontrada");
          const code = buildPlanCode(input.audienceCode, input.durationMonths);
          const { data, error } = await supabase
            .from("packages")
            .insert([{
              organization_id: ctx.user.organizationId,
              unit_id: ctx.user.unitId,
              code,
              audience_code: input.audienceCode,
              duration_months: input.durationMonths,
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
        audienceCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,8}$/).optional(),
        durationMonths: z.number().int().min(1).max(60).optional(),
        totalBaths: z.number().min(0).optional(),
        totalGroomings: z.number().min(0).optional(),
        totalPrice: z.number().min(0).optional(),
        monthlyPrice: z.number().min(0).optional(),
        recurrenceType: z.string().optional(),
        status: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
          const { id, ...updateData } = input;
          const updatePayload: Record<string, any> = {};

          if (updateData.name) updatePayload.name = updateData.name;
          if (updateData.description !== undefined) updatePayload.description = updateData.description || null;
          if (updateData.audienceCode !== undefined) updatePayload.audience_code = updateData.audienceCode;
          if (updateData.durationMonths !== undefined) updatePayload.duration_months = updateData.durationMonths;
          if (updateData.audienceCode !== undefined || updateData.durationMonths !== undefined) {
            const { data: current } = await supabase.from("packages")
              .select("audience_code, duration_months").eq("id", id).eq("unit_id", ctx.user.unitId).single();
            if (!current) throw new Error("Plano não encontrado");
            updatePayload.code = buildPlanCode(
              updateData.audienceCode ?? current.audience_code,
              updateData.durationMonths ?? current.duration_months,
            );
          }
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
            .eq("unit_id", ctx.user.unitId)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error updating package:", error);
          throw new Error("Erro ao atualizar plano");
        }
      }),

    // Planos vinculados são inativados para preservar contratos e histórico.
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user?.unitId) throw new Error("Unidade ativa não encontrada");
          const { error } = await supabase
            .from("packages")
            .update({ status: "inactive", updated_at: new Date().toISOString() })
            .eq("id", input.id)
            .eq("unit_id", ctx.user.unitId);

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
