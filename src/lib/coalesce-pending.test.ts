import { describe, expect, it, vi } from 'vitest';
import { coalescePending } from './coalesce-pending';

describe('coalescePending', () => {
  it('shares a concurrent read and starts a fresh read after it settles', async () => {
    let resolve!: (value: number) => void;
    const load = vi.fn()
      .mockImplementationOnce(() => new Promise<number>((done) => { resolve = done; }))
      .mockResolvedValue(43);
    const first = coalescePending('shared-read', load);
    const second = coalescePending('shared-read', load);

    expect(load).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    resolve(42);
    await expect(first).resolves.toBe(42);
    await expect(coalescePending('shared-read', load)).resolves.toBe(43);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('retries after a failed read', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('ok');
    await expect(coalescePending('failed-read', load)).rejects.toThrow('offline');
    await expect(coalescePending('failed-read', load)).resolves.toBe('ok');
    expect(load).toHaveBeenCalledTimes(2);
  });
});
