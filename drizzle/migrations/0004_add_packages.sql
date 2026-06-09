-- Create packages table
CREATE TABLE IF NOT EXISTS "packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "unit_id" uuid NOT NULL REFERENCES "units"("id") ON DELETE CASCADE,
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "total_baths" serial DEFAULT 0,
  "total_groomings" serial DEFAULT 0,
  "baths_used" serial DEFAULT 0,
  "groomings_used" serial DEFAULT 0,
  "price" numeric(10, 2) NOT NULL,
  "start_date" timestamp with time zone NOT NULL,
  "end_date" timestamp with time zone NOT NULL,
  "status" varchar(50) DEFAULT 'active',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone
);

-- Create package_sessions table
CREATE TABLE IF NOT EXISTS "package_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "package_id" uuid NOT NULL REFERENCES "packages"("id") ON DELETE CASCADE,
  "appointment_id" uuid REFERENCES "appointments"("id") ON DELETE SET NULL,
  "session_type" varchar(50) NOT NULL,
  "used_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Grant permissions to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON "packages" TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "package_sessions" TO service_role;
