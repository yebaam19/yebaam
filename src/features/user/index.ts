// Services
export { userProfileService } from './services/user-profile.service';
export type { 
  UserProfile, 
  UserLocation, 
  UserPrivacy, 
  UserStats 
} from './services/user-profile.service';

// Hooks
export { useMyProfile, useUserProfile } from './hooks/useUserProfile';

// Components (si existen)
export * from './components';
