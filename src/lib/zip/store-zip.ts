import 'server-only';

/**
 * Streaming ZIP writer — "store" method (no compression), zero dependencies.
 *
 * Why hand-rolled instead of `archiver`/`jszip`: the only payloads we archive
 * are already-compressed media (MP3/FLAC/JPEG), so DEFLATE would burn CPU for
 * ~0% gain, and both libraries want the whole archive (or a Node stream stack)
 * in play. Here each entry is opened lazily, one at a time, and its bytes are
 * piped straight from R2 / Cloudflare Images into the HTTP response — a 300 MB
 * album never lands in the function's memory.
 *
 * Format notes (APPNOTE 6.3.x):
 *  - General-purpose bit 3 (data descriptor) is set because CRC-32 and size are
 *    only known *after* the body has streamed through. Sizes in the local
 *    header are therefore zeros, per spec, and the real values are written in
 *    the trailing descriptor plus the central directory (which is what Windows
 *    Explorer, 7-Zip, macOS Archive Utility and `unzip` all read).
 *  - Bit 11 (UTF-8 names) is set so accented track titles survive.
 *  - No Zip64: entries are capped upstream (200 MB per audio file) and the
 *    caller must refuse anything whose total would cross MAX_ZIP_BYTES.
 */

/** 4 GiB - 1: the largest offset/size a non-Zip64 archive can address. */
export const MAX_ZIP_BYTES = 0xffffffff;

export type ZipBody = ReadableStream<Uint8Array> | Uint8Array;

export interface ZipEntry {
  /** Path inside the archive (`/` separates folders). */
  name: string;
  /**
   * Opened right before the entry's header is written, so failures can be
   * skipped cleanly and only one upstream connection is held at a time.
   * Return `null` to omit the entry entirely.
   */
  open: () => Promise<ZipBody | null> | ZipBody | null;
}

export interface ZipOptions {
  /** Timestamp stamped on every entry. Defaults to now. */
  modifiedAt?: Date;
  /** Called when an entry's `open()` throws — the entry is skipped, the rest of
   *  the archive still streams. */
  onEntryError?: (entryName: string, error: unknown) => void;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

/** Running CRC-32 register (pre-XOR). Seed with `0xffffffff`, finish with
 *  `(crc ^ 0xffffffff) >>> 0`. */
function crc32Update(crc: number, chunk: Uint8Array): number {
  let c = crc;
  for (let i = 0; i < chunk.length; i += 1) {
    c = CRC_TABLE[(c ^ chunk[i]) & 0xff] ^ (c >>> 8);
  }
  return c >>> 0;
}

/** MS-DOS packed date/time (2 s resolution, epoch 1980). */
function dosDateTime(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2) & 0x1f),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

const FLAGS = 0x0808; // bit 3 = data descriptor, bit 11 = UTF-8 filename
const VERSION = 20; // 2.0 — store + data descriptor

function localHeader(nameBytes: Uint8Array, time: number, date: number): Uint8Array {
  const buf = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(buf.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, VERSION, true);
  view.setUint16(6, FLAGS, true);
  view.setUint16(8, 0, true); // method: store
  view.setUint16(10, time, true);
  view.setUint16(12, date, true);
  // crc32 / compressed / uncompressed stay zero — they travel in the descriptor.
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, 0, true); // extra field length
  buf.set(nameBytes, 30);
  return buf;
}

function dataDescriptor(crc: number, size: number): Uint8Array {
  const buf = new Uint8Array(16);
  const view = new DataView(buf.buffer);
  view.setUint32(0, 0x08074b50, true);
  view.setUint32(4, crc, true);
  view.setUint32(8, size, true); // compressed === uncompressed (store)
  view.setUint32(12, size, true);
  return buf;
}

function centralHeader(
  nameBytes: Uint8Array,
  time: number,
  date: number,
  crc: number,
  size: number,
  localOffset: number,
): Uint8Array {
  const buf = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(buf.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, VERSION, true); // version made by (MS-DOS)
  view.setUint16(6, VERSION, true); // version needed
  view.setUint16(8, FLAGS, true);
  view.setUint16(10, 0, true); // method: store
  view.setUint16(12, time, true);
  view.setUint16(14, date, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameBytes.length, true);
  // extra len / comment len / disk / internal attrs stay zero
  view.setUint32(38, 0, true); // external attrs
  view.setUint32(42, localOffset, true);
  buf.set(nameBytes, 46);
  return buf;
}

function endOfCentralDirectory(count: number, size: number, offset: number): Uint8Array {
  const buf = new Uint8Array(22);
  const view = new DataView(buf.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, size, true);
  view.setUint32(16, offset, true);
  return buf;
}

/** Windows/macOS-safe entry name: no path traversal, no reserved characters. */
export function safeZipName(name: string, fallback = 'archivo'): string {
  const clean = name
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .slice(0, 120)
    .trim();
  return clean || fallback;
}

async function* zipChunks(
  entries: readonly ZipEntry[],
  options: ZipOptions,
): AsyncGenerator<Uint8Array> {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(options.modifiedAt ?? new Date());
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    let body: ZipBody | null;
    try {
      body = await entry.open();
    } catch (err) {
      options.onEntryError?.(entry.name, err);
      continue;
    }
    if (!body) continue;

    const nameBytes = encoder.encode(entry.name);
    const header = localHeader(nameBytes, time, date);
    const localOffset = offset;
    yield header;
    offset += header.length;

    let crc = 0xffffffff;
    let size = 0;
    if (body instanceof Uint8Array) {
      crc = crc32Update(crc, body);
      size = body.length;
      if (size > 0) yield body;
    } else {
      const reader = body.getReader();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value || value.byteLength === 0) continue;
          const chunk =
            value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBufferLike);
          crc = crc32Update(crc, chunk);
          size += chunk.length;
          yield chunk;
        }
      } finally {
        reader.releaseLock();
      }
    }
    offset += size;

    const finalCrc = (crc ^ 0xffffffff) >>> 0;
    const descriptor = dataDescriptor(finalCrc, size);
    yield descriptor;
    offset += descriptor.length;

    if (offset > MAX_ZIP_BYTES) {
      throw new Error('El archivo .zip superó los 4 GB admitidos sin Zip64.');
    }
    central.push(centralHeader(nameBytes, time, date, finalCrc, size, localOffset));
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const record of central) {
    yield record;
    centralSize += record.length;
  }
  yield endOfCentralDirectory(central.length, centralSize, centralOffset);
}

/**
 * Build the archive as a web `ReadableStream` ready to hand to `new Response()`.
 * Entries are consumed strictly in order and only as the client pulls bytes, so
 * backpressure propagates all the way to R2.
 */
export function createStoreZipStream(
  entries: readonly ZipEntry[],
  options: ZipOptions = {},
): ReadableStream<Uint8Array> {
  const iterator = zipChunks(entries, options)[Symbol.asyncIterator]();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) controller.close();
        else controller.enqueue(value);
      } catch (err) {
        controller.error(err);
      }
    },
    async cancel(reason) {
      await iterator.return?.(reason);
    },
  });
}
