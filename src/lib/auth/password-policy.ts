export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'La contraseña debe contener al menos una mayúscula, una minúscula y un número';

export function validatePasswordPolicy(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    return PASSWORD_COMPLEXITY_MESSAGE;
  }
  return null;
}
