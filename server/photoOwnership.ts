/** Never sign an arbitrary key with the server's Storage credentials. */
export function ownedPhotoKey(record: { id?: string; organization_id?: string; photo_storage_key?: unknown }, kind: "pets" | "clients"): string | null {
  const key = record.photo_storage_key;
  if (!record.id || !record.organization_id || typeof key !== "string" || key.length > 512) return null;
  const prefix = `${record.organization_id}/${kind}/${record.id}/`;
  if (!key.startsWith(prefix)) return null;
  const filename = key.slice(prefix.length);
  if (!filename || filename === "." || filename === ".." || /[\/\\?#%\x00-\x1f\x7f]/.test(filename)) return null;
  return key;
}
