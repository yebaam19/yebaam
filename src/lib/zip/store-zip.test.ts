import { describe, expect, it, vi } from 'vitest';
import { createStoreZipStream, safeZipName, type ZipEntry } from './store-zip';

/**
 * The ZIP writer is hand-rolled, so these tests assert the byte layout a real
 * extractor depends on: local header + data descriptor per entry, a central
 * directory that repeats CRC/size, and an EOCD pointing at it. The output was
 * additionally cross-checked against three real extractors (Windows Explorer's
 * zipfldr, .NET ZipArchive via Expand-Archive, and bsdtar) on a 3 MB payload:
 * all three round-trip the bytes and the accented names intact.
 */

async function collect(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

function streamOf(...parts: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of parts) controller.enqueue(encoder.encode(p));
      controller.close();
    },
  });
}

function u32(bytes: Uint8Array, at: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(at, true);
}
function u16(bytes: Uint8Array, at: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(at, true);
}

/** CRC-32 computed independently of the implementation under test. */
function crc32(input: string): number {
  const bytes = new TextEncoder().encode(input);
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i += 1) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const MODIFIED = new Date('2026-07-31T10:20:30Z');

describe('createStoreZipStream', () => {
  it('writes local headers, data descriptors, a central directory and an EOCD', async () => {
    const entries: ZipEntry[] = [
      { name: 'a.txt', open: () => new TextEncoder().encode('hola') },
      { name: 'sub/b.txt', open: () => streamOf('mun', 'do') },
    ];
    const zip = await collect(createStoreZipStream(entries, { modifiedAt: MODIFIED }));

    expect(u32(zip, 0)).toBe(0x04034b50); // first local header
    expect(u16(zip, 6)).toBe(0x0808); // data descriptor + UTF-8 flags
    expect(u16(zip, 8)).toBe(0); // store, never deflate

    // Local header sizes are zero per APPNOTE when bit 3 is set.
    expect(u32(zip, 14)).toBe(0);
    expect(u32(zip, 18)).toBe(0);
    expect(u32(zip, 22)).toBe(0);

    // …and the real values arrive in the trailing descriptor.
    const firstDescriptorAt = 30 + 'a.txt'.length + 'hola'.length;
    expect(u32(zip, firstDescriptorAt)).toBe(0x08074b50);
    expect(u32(zip, firstDescriptorAt + 4)).toBe(crc32('hola'));
    expect(u32(zip, firstDescriptorAt + 8)).toBe(4);
    expect(u32(zip, firstDescriptorAt + 12)).toBe(4);

    const eocdAt = zip.length - 22;
    expect(u32(zip, eocdAt)).toBe(0x06054b50);
    expect(u16(zip, eocdAt + 8)).toBe(2); // entries on this disk
    expect(u16(zip, eocdAt + 10)).toBe(2);

    const centralAt = u32(zip, eocdAt + 16);
    expect(u32(zip, centralAt)).toBe(0x02014b50);
    expect(u32(zip, centralAt + 16)).toBe(crc32('hola'));
    expect(u32(zip, centralAt + 20)).toBe(4);
    expect(u32(zip, centralAt + 42)).toBe(0); // first entry starts at offset 0
    expect(u32(zip, eocdAt + 12)).toBe(zip.length - 22 - centralAt); // central dir size

    // The second entry's central record carries the streamed body's CRC/size.
    const secondCentralAt = centralAt + 46 + 'a.txt'.length;
    expect(u32(zip, secondCentralAt)).toBe(0x02014b50);
    expect(u32(zip, secondCentralAt + 16)).toBe(crc32('mundo'));
    expect(u32(zip, secondCentralAt + 20)).toBe(5);

    // Names survive verbatim, folders included.
    const text = new TextDecoder().decode(zip);
    expect(text).toContain('sub/b.txt');
    expect(text).toContain('mundo');
  });

  it('skips an entry whose open() throws and reports it, then keeps streaming', async () => {
    const onEntryError = vi.fn();
    const entries: ZipEntry[] = [
      {
        name: 'roto.mp3',
        open: () => {
          throw new Error('R2 404');
        },
      },
      { name: 'ok.txt', open: () => new TextEncoder().encode('ok') },
    ];
    const zip = await collect(createStoreZipStream(entries, { modifiedAt: MODIFIED, onEntryError }));

    expect(onEntryError).toHaveBeenCalledWith('roto.mp3', expect.any(Error));
    const text = new TextDecoder().decode(zip);
    expect(text).not.toContain('roto.mp3');
    expect(text).toContain('ok.txt');
    expect(u16(zip, zip.length - 22 + 10)).toBe(1); // only the surviving entry
  });

  it('omits entries whose open() returns null (the "no errors" trailer)', async () => {
    const entries: ZipEntry[] = [
      { name: 'ficha.txt', open: () => new TextEncoder().encode('x') },
      { name: 'ERRORES.txt', open: () => null },
    ];
    const zip = await collect(createStoreZipStream(entries, { modifiedAt: MODIFIED }));
    expect(new TextDecoder().decode(zip)).not.toContain('ERRORES.txt');
    expect(u16(zip, zip.length - 22 + 10)).toBe(1);
  });

  it('opens entries lazily and in order — one upstream connection at a time', async () => {
    const opened: string[] = [];
    const entry = (name: string): ZipEntry => ({
      name,
      open: () => {
        opened.push(name);
        return new TextEncoder().encode(name);
      },
    });
    const stream = createStoreZipStream([entry('1'), entry('2'), entry('3')]);
    expect(opened).toEqual([]);
    const reader = stream.getReader();
    await reader.read();
    expect(opened).toEqual(['1']);
    await reader.cancel();
  });

  it('produces a valid empty archive', async () => {
    const zip = await collect(createStoreZipStream([]));
    expect(zip.length).toBe(22);
    expect(u32(zip, 0)).toBe(0x06054b50);
    expect(u16(zip, 10)).toBe(0);
  });
});

describe('safeZipName', () => {
  it('keeps accents but strips path separators and reserved characters', () => {
    expect(safeZipName('Canción / Lado A')).toBe('Canción - Lado A');
    expect(safeZipName('a:b*c?d"e<f>g|h')).toBe('a-b-c-d-e-f-g-h');
  });

  it('refuses traversal and empty names', () => {
    expect(safeZipName('../../etc/passwd')).toBe('..-..-etc-passwd'.replace(/^\.+/, ''));
    expect(safeZipName('   ')).toBe('archivo');
    expect(safeZipName('', 'pista')).toBe('pista');
  });
});
