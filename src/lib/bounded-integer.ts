export function boundedInteger(value: number, max: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new RangeError(`El valor debe estar entre 1 y ${max}.`);
  }
  return value;
}
