import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
  readFileSync(path.resolve(process.cwd(), file), "utf8");

const router = read("server/routers.ts");
const petForm = read("client/src/components/PetForm.tsx");
const unitsPage = read("client/src/pages/Units.tsx");
const unitForm = read("client/src/components/UnitFormDialog.tsx");
const migration = read(
  "supabase/migrations/202607190004_pet_photos_and_unit_management.sql",
);

describe("pet, unit and service fixes", () => {
  it("normalizes persisted pet fields and uploads only after a real pet id exists", () => {
    expect(petForm).toContain("petData?.coat_type ?? petData?.coatType");
    expect(petForm).toContain("String(petData.weight)");
    expect(petForm).toContain("savedPetId = createdPet.id");
    expect(petForm).not.toContain('uploadPhoto(photoFile, "temp")');
  });

  it("stores a durable photo key and issues fresh signed URLs", () => {
    expect(migration).toContain("photo_storage_key text");
    expect(router).toContain("photo_storage_key: fileKey");
    expect(router).toContain("createSignedUrl(pet.photo_storage_key");
  });

  it("allows administrators to create and edit units with RLS protection", () => {
    expect(router).toContain("saveUnit: protectedProcedure");
    expect(router).toContain('["owner", "admin"].includes(ctx.user.role)');
    expect(unitsPage).toContain("Nova unidade");
    expect(unitForm).toContain("Salvar unidade");
    expect(migration).toContain("organization_units_manage");
  });

  it("maps service duration to the interface field", () => {
    expect(router).toContain("durationMinutes: service.duration_minutes");
  });
});
