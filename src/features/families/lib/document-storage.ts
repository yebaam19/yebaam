const PDF_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;

function familyDocumentPrefix(userId: string, familyId: string) {
  return `${userId}/families/${familyId}/`;
}

export function familyDocumentKey(userId: string, familyId: string, uploadId: string) {
  return `${familyDocumentPrefix(userId, familyId)}${uploadId}.pdf`;
}

/** Validate references at both write and read boundaries; never sign arbitrary keys. */
export function isFamilyDocumentReference(reference: string, userId: string, familyId: string) {
  const prefix = `r2:${familyDocumentPrefix(userId, familyId)}`;
  return reference.startsWith(prefix) && PDF_NAME.test(reference.slice(prefix.length));
}
