import { createHash } from 'node:crypto';

export const SOURCE_STORAGE_URL = 'https://cvnshgqqqwwkcjeunecj.supabase.co';
export const QA_STORAGE_URL = 'https://bvmyovgourushalerpza.supabase.co';
export const MAX_RECOVERY_OBJECT_BYTES = 25 * 1024 * 1024;
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function assertStorageRecoveryConfig({ sourceUrl, targetUrl, sourceKey, targetKey }) {
  if (sourceUrl !== SOURCE_STORAGE_URL || targetUrl !== QA_STORAGE_URL || sourceUrl === targetUrl) throw new Error('Unapproved storage destination');
  // Exposed legacy keys must not be reused for the recovery workflow.
  for (const key of [sourceKey, targetKey]) if (typeof key !== 'string' || !/^sb_secret_[A-Za-z0-9_-]{16,}$/.test(key)) throw new Error('Private replacement secret keys required');
  if (sourceKey === targetKey) throw new Error('Projects must have separate secret keys');
}

export function validateStorageEntry(entry) {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(entry.bucket) || typeof entry.name !== 'string' || !entry.name || entry.name.length > 1024 || /[\\\u0000-\u001f\u007f%]/.test(entry.name) || entry.name.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Unsafe storage object reference');
  if (!Number.isSafeInteger(entry.size) || entry.size < 0 || entry.size > MAX_RECOVERY_OBJECT_BYTES) throw new Error('Object requires separate size review');
  return entry;
}

export async function backupStorageObject({ entry, downloadSource, savePrivate }) {
  validateStorageEntry(entry);
  const bytes = Buffer.from(await downloadSource(entry));
  if (bytes.length !== entry.size) throw new Error('Source size changed; no verified backup');
  const digest = sha256(bytes);
  // Never use remote object names as local filesystem paths.
  const localName = sha256(Buffer.from(entry.bucket + '\0' + entry.name)) + '.bin';
  await savePrivate(localName, bytes);
  return { ...entry, localName, sha256: digest };
}

export async function restoreStorageObject({ entry, targetUrl, readPrivate, downloadTarget, uploadTarget }) {
  if (targetUrl !== QA_STORAGE_URL) throw new Error('Unapproved storage destination');
  validateStorageEntry(entry);
  if (!/^[a-f0-9]{64}\.bin$/.test(entry.localName)) throw new Error('Unsafe private archive path');
  const bytes = Buffer.from(await readPrivate(entry.localName));
  if (bytes.length !== entry.size || sha256(bytes) !== entry.sha256) throw new Error('Private archive integrity failed');
  const existing = await downloadTarget(entry); // null means a verified 404 only; other failures must throw.
  if (existing !== null) {
    if (sha256(Buffer.from(existing)) !== entry.sha256) throw new Error('QA object differs; refusing overwrite');
    return { verified: true, uploaded: false };
  }
  // QA metadata was restored by pg_dump; upsert is permitted only after the verified missing-byte check.
  await uploadTarget(entry, bytes);
  const restored = await downloadTarget(entry);
  if (restored === null || Buffer.from(restored).length !== entry.size || sha256(Buffer.from(restored)) !== entry.sha256) throw new Error('QA download verification failed');
  return { verified: true, uploaded: true };
}
