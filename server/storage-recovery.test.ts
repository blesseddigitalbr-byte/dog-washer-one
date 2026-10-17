import { describe, it, expect, vi } from 'vitest';
import { assertStorageRecoveryConfig, backupStorageObject, restoreStorageObject, validateStorageEntry, SOURCE_STORAGE_URL, QA_STORAGE_URL, sha256 } from '../scripts/storage-recovery.mjs';
const config = { sourceUrl: SOURCE_STORAGE_URL, targetUrl: QA_STORAGE_URL, sourceKey: 'sb_secret_test_SOURCE_1234567890', targetKey: 'sb_secret_test_TARGET_1234567890' };
const bytes = Buffer.from('isolated test bytes');
const entry = { bucket: 'pet-photos', name: 'org/pets/id/image.png', size: bytes.length, mimetype: 'image/png' };
const backed = { ...entry, localName: 'a'.repeat(64) + '.bin', sha256: sha256(bytes) };
describe('private Storage recovery without real credentials or network', () => {
  it('accepts only replacement secrets and the approved independent projects', () => expect(() => assertStorageRecoveryConfig(config)).not.toThrow());
  it.each([{ targetUrl: SOURCE_STORAGE_URL }, { sourceKey: 'eyJ.exposed.legacy' }, { sourceKey: '' }, { targetKey: config.sourceKey }, { targetUrl: 'https://example.invalid' }])('rejects unsafe credentials or destination %#', change => expect(() => assertStorageRecoveryConfig({ ...config, ...change })).toThrow());
  it.each(['../image.png', 'a/../b', 'a\\b', 'a/%2e%2e/b', '/absolute'])('rejects ambiguous remote paths: %s', name => expect(() => validateStorageEntry({ ...entry, name })).toThrow());
  it('backs up original bytes under an opaque local filename', async () => {
    const savePrivate = vi.fn(); const result = await backupStorageObject({ entry, downloadSource: async () => bytes, savePrivate });
    expect(result.localName).toMatch(/^[a-f0-9]{64}\.bin$/); expect(result.localName).not.toContain('image'); expect(result.sha256).toBe(sha256(bytes)); expect(savePrivate).toHaveBeenCalledOnce();
  });
  it('rejects changed source size before writing a backup', async () => {
    const savePrivate = vi.fn(); await expect(backupStorageObject({ entry, downloadSource: async () => Buffer.from('changed'), savePrivate })).rejects.toThrow(); expect(savePrivate).not.toHaveBeenCalled();
  });
  it('checks private bytes, uploads to QA and verifies the downloaded bytes', async () => {
    const uploadTarget = vi.fn(); const downloadTarget = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(bytes);
    await expect(restoreStorageObject({ entry: backed, targetUrl: QA_STORAGE_URL, readPrivate: async () => bytes, downloadTarget, uploadTarget })).resolves.toEqual({ verified: true, uploaded: true }); expect(uploadTarget).toHaveBeenCalledOnce();
  });
  it('does not upload an already matching QA file', async () => {
    const uploadTarget = vi.fn(); await expect(restoreStorageObject({ entry: backed, targetUrl: QA_STORAGE_URL, readPrivate: async () => bytes, downloadTarget: async () => bytes, uploadTarget })).resolves.toEqual({ verified: true, uploaded: false }); expect(uploadTarget).not.toHaveBeenCalled();
  });
  it('never overwrites a different QA file', async () => {
    const uploadTarget = vi.fn(); await expect(restoreStorageObject({ entry: backed, targetUrl: QA_STORAGE_URL, readPrivate: async () => bytes, downloadTarget: async () => Buffer.from('other'), uploadTarget })).rejects.toThrow('refusing overwrite'); expect(uploadTarget).not.toHaveBeenCalled();
  });
  it('refuses corrupted local data before contacting the QA service', async () => {
    const downloadTarget = vi.fn(); await expect(restoreStorageObject({ entry: backed, targetUrl: QA_STORAGE_URL, readPrivate: async () => Buffer.from('tampered'), downloadTarget, uploadTarget: vi.fn() })).rejects.toThrow('integrity'); expect(downloadTarget).not.toHaveBeenCalled();
  });
  it('does not interpret an authorization or network failure as a missing QA object', async () => {
    const uploadTarget = vi.fn(); await expect(restoreStorageObject({ entry: backed, targetUrl: QA_STORAGE_URL, readPrivate: async () => bytes, downloadTarget: async () => { throw new Error('unauthorized'); }, uploadTarget })).rejects.toThrow('unauthorized'); expect(uploadTarget).not.toHaveBeenCalled();
  });
  it('fails when post-upload bytes do not match', async () => {
    await expect(restoreStorageObject({ entry: backed, targetUrl: QA_STORAGE_URL, readPrivate: async () => bytes, downloadTarget: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(Buffer.from('bad')), uploadTarget: vi.fn() })).rejects.toThrow('verification');
  });
  it('rejects a production restore destination before any callback', async () => {
    const readPrivate = vi.fn(); await expect(restoreStorageObject({ entry: backed, targetUrl: SOURCE_STORAGE_URL, readPrivate, downloadTarget: vi.fn(), uploadTarget: vi.fn() })).rejects.toThrow('destination'); expect(readPrivate).not.toHaveBeenCalled();
  });
  it('requires separate review for oversized objects', () => expect(() => validateStorageEntry({ ...entry, size: 26 * 1024 * 1024 })).toThrow('size review'));
});
