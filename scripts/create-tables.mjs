import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  try {
    console.log("🔄 Conectando ao banco de dados...");
    await client.connect();
    console.log("✅ Conectado!");

    console.log("🔄 Criando tabelas...");

    // Create packages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        total_baths INTEGER DEFAULT 0,
        total_groomings INTEGER DEFAULT 0,
        total_price DECIMAL(10, 2) NOT NULL,
        monthly_price DECIMAL(10, 2) DEFAULT 0,
        recurrence_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabela packages criada!");

    // Create package_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS package_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
        client_id VARCHAR(100),
        baths_used INTEGER DEFAULT 0,
        groomings_used INTEGER DEFAULT 0,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabela package_sessions criada!");

    // Insert sample packages
    await client.query(`
      INSERT INTO packages (name, total_baths, total_groomings, total_price, monthly_price, recurrence_type, status)
      VALUES 
        ('Nutri Pró Maxxi Trimestral Spitz', 5, 1, 400.00, 0.00, 'PIX Santander', 'active'),
        ('Nutri Pró Maxxi Semestral Spitz', 9, 3, 900.00, 150.00, 'Boleto Asaas', 'active'),
        ('Nutri Pró Maxxi Anual Spitz', 18, 6, 1800.00, 150.00, 'Cartão de Crédito', 'active')
      ON CONFLICT DO NOTHING;
    `);
    console.log("✅ Dados de exemplo inseridos!");

    console.log("✅ Todas as tabelas criadas com sucesso!");
    await client.end();
  } catch (error) {
    console.error("❌ Erro:", error);
    await client.end();
    process.exit(1);
  }
}

createTables();
