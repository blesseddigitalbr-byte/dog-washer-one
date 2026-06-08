/**
 * Gerador de códigos de cadastro sequenciais
 * CLI-0001, CLI-0002, ... para clientes
 * PET-0001, PET-0002, ... para pets
 */

import { supabase } from "./_core/supabase";

/**
 * Gera próximo código de cliente (CLI-XXXX)
 */
export async function generateClientCode(): Promise<string> {
  try {
    // Buscar o último cliente com código
    const { data, error } = await supabase
      .from("clientes")
      .select("id_cliente")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastCode = data[0].id_cliente;
      // Extrair número do código (ex: "CLI-0001" -> 1)
      const match = lastCode?.match(/CLI-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `CLI-${String(nextNumber).padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating client code:", error);
    throw new Error("Erro ao gerar código de cliente");
  }
}

/**
 * Gera próximo código de pet (PET-XXXX)
 */
export async function generatePetCode(): Promise<string> {
  try {
    // Buscar o último pet com código
    const { data, error } = await supabase
      .from("pets")
      .select("id_pet")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastCode = data[0].id_pet;
      // Extrair número do código (ex: "PET-0001" -> 1)
      const match = lastCode?.match(/PET-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `PET-${String(nextNumber).padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating pet code:", error);
    throw new Error("Erro ao gerar código de pet");
  }
}
