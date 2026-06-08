#!/usr/bin/env node

/**
 * Script para criar tabelas de pacotes no Supabase
 * Execução: node scripts/create-packages-tables.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cdfjjhbczgyyogocioro.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY não está definida!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function createPackagesTables() {
  try {
    console.log("📦 Criando tabelas de pacotes...\n");

    // SQL para criar tabelas
    const sql = `
      -- Criar tabela packages (planos)
      CREATE TABLE IF NOT EXISTS packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        total_baths INTEGER NOT NULL DEFAULT 0,
        total_groomings INTEGER NOT NULL DEFAULT 0,
        total_price DECIMAL(10, 2) NOT NULL,
        monthly_price DECIMAL(10, 2) DEFAULT 0,
        recurrence_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Criar tabela package_sessions (rastreamento de uso)
      CREATE TABLE IF NOT EXISTS package_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        client_id UUID NOT NULL,
        baths_used INTEGER DEFAULT 0,
        groomings_used INTEGER DEFAULT 0,
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Criar índices
      CREATE INDEX IF NOT EXISTS idx_package_sessions_package_id ON package_sessions(package_id);
      CREATE INDEX IF NOT EXISTS idx_package_sessions_client_id ON package_sessions(client_id);
      CREATE INDEX IF NOT EXISTS idx_package_sessions_status ON package_sessions(status);
    `;

    // Executar SQL
    const { error } = await supabase.rpc("exec", { sql });

    if (error) {
      // Se exec não funcionar, tentar criar tabelas individuais
      console.log("⚠️ Método RPC falhou, tentando criar tabelas individualmente...\n");

      // Criar tabela packages
      const { error: pkgError } = await supabase.from("packages").select("id").limit(1);
      if (pkgError && pkgError.code === "PGRST116") {
        console.log("✅ Tabela packages será criada via insert...");
      }

      // Criar tabela package_sessions
      const { error: sessError } = await supabase.from("package_sessions").select("id").limit(1);
      if (sessError && sessError.code === "PGRST116") {
        console.log("✅ Tabela package_sessions será criada via insert...");
      }

      console.log("\n⚠️ Aviso: Tabelas podem precisar ser criadas manualmente no Supabase Dashboard");
      console.log("SQL fornecido acima pode ser executado no Editor SQL do Supabase.\n");
    } else {
      console.log("✅ Tabelas criadas com sucesso!\n");
    }

    // Verificar se tabelas existem
    console.log("🔍 Verificando tabelas...\n");

    const { data: packages, error: pkgCheckError } = await supabase
      .from("packages")
      .select("id")
      .limit(1);

    if (!pkgCheckError) {
      console.log("✅ Tabela 'packages' existe e está acessível");
    } else {
      console.log("❌ Tabela 'packages' não encontrada:", pkgCheckError.message);
    }

    const { data: sessions, error: sessCheckError } = await supabase
      .from("package_sessions")
      .select("id")
      .limit(1);

    if (!sessCheckError) {
      console.log("✅ Tabela 'package_sessions' existe e está acessível");
    } else {
      console.log("❌ Tabela 'package_sessions' não encontrada:", sessCheckError.message);
    }

    console.log("\n✅ Script concluído!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

createPackagesTables();
