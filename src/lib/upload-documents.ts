/** Client/server contract for the institutional document library. */
export const DOCUMENT_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  zip: 'application/zip',
} as const;
export const DOCUMENT_ACCEPT = Object.keys(DOCUMENT_TYPES).map((extension) => `.${extension}`).join(',');

export function documentContentType(name: string, suppliedType: string): string | null {
  const extension = name.split('.').pop()?.toLowerCase() as keyof typeof DOCUMENT_TYPES;
  const expected = DOCUMENT_TYPES[extension];
  if (!expected) return null;
  const actual = suppliedType === 'application/x-zip-compressed' ? 'application/zip' : suppliedType;
  return !actual || actual === expected ? expected : null;
}

export function documentExtension(contentType: string): string | null {
  return Object.entries(DOCUMENT_TYPES).find(([, mime]) => mime === contentType)?.[0] ?? null;
}
