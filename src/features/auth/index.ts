/**
 * Auth Module - Barrel Export
 * 
 * Exporta todos los componentes, hooks y tipos del módulo de autenticación.
 * Facilita las importaciones desde otros módulos.
 * 
 * Uso:
 * ```tsx
 * import { useAuth, AuthProvider, type AuthUser } from '@/features/auth';
 * ```
 */

// Context & Hooks
export { AuthProvider, useAuth } from './context/auth-context';

// Store
export { useAuthStore } from './store/auth.store';

// Services
export { authService } from './services/auth.service';

// Types & Interfaces
export type {
  AuthUser,
  AuthResponseDTO,
  LoginDTO,
  RegisterDTO,
  VerifyEmailRequest,
  ResendOtpRequest,
  MessageResponse,
} from './interfaces/auth.interfaces';
