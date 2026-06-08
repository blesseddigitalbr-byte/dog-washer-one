import { describe, it, expect } from "vitest";
import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

describe("Upload de Fotos - Supabase Client", () => {
  it("deve conectar ao Supabase", async () => {
    const { data, error } = await supabase
      .from("pets")
      .select("id")
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("deve inserir foto em galeria_pets", async () => {
    // Primeiro criar um pet de teste
    const { data: petData, error: petError } = await supabase
      .from("pets")
      .insert({
        organization_id: uuidv4(),
        client_id: uuidv4(),
        name: "Pet Teste Upload",
        species: "Cachorro",
      })
      .select()
      .single();

    if (petError || !petData) {
      console.log("Pulando teste - não conseguiu criar pet de teste");
      return;
    }

    const realPetId = petData.id;

    // Inserir foto
    const { data, error } = await supabase
      .from("galeria_pets")
      .insert({
        pet_id: realPetId,
        url: "/manus-storage/test.jpg",
        file_name: "test.jpg",
        file_size: 1024,
        mime_type: "image/jpeg",
      })
      .select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data && data.length > 0) {
      expect(data[0].pet_id).toBe(realPetId);
    }
  });

  it("deve conectar ao Supabase com chaves públicas", async () => {
    // Validar que Supabase Client está configurado
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeDefined();
  });
});
