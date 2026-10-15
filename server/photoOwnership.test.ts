import { describe, expect, it } from "vitest";
import { ownedPhotoKey } from "./photoOwnership";
const record = { id: "pet-id", organization_id: "org-id", photo_storage_key: "org-id/pets/pet-id/file.png" };
describe("photo ownership before privileged signing", () => {
  it("accepts only the exact record namespace", () => expect(ownedPhotoKey(record, "pets")).toBe(record.photo_storage_key));
  it.each([
    "other-org/pets/pet-id/file.png", "org-id/pets/other-pet/file.png", "org-id/clients/pet-id/file.png",
    "org-id/pets/pet-id/../other/file.png", "org-id/pets/pet-id/%2e%2e", "org-id/pets/pet-id/",
    "org-id/pets/pet-id/a?token=secret", "org-id/pets/pet-id/..", "org-id/pets/pet-id/a\\other",
  ])("rejects forged or ambiguous key %s", photo_storage_key => expect(ownedPhotoKey({ ...record, photo_storage_key }, "pets")).toBeNull());
  it("separates tutor and pet namespaces", () => expect(ownedPhotoKey(record, "clients")).toBeNull());
  it("does not accept a missing tenant", () => expect(ownedPhotoKey({ ...record, organization_id: undefined }, "pets")).toBeNull());
});
