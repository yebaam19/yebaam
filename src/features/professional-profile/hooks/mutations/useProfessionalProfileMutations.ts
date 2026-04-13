/**
 * Professional Profile Mutations (native, no TanStack)
 */

'use client';

import { toast } from 'sonner';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { cacheKey, invalidate, setCached } from '@/lib/hooks/cacheStore';
import type {
  AssociationFormData,
  CreateProfessionalProfileDTO,
  ExperienceFormData,
  LanguageFormData,
  LicenseFormData,
  SkillFormData,
  StudyFormData,
  TitleFormData,
  UpdateProfessionalProfileDTO,
} from '../../interfaces/professional-profile.interfaces';
import { professionalProfileService } from '../../services/professional-profile.service';

type CachedRecord<T> = { data: T; fetchedAt: number };

function invalidateAll(profileId?: string) {
  invalidate('professional-profile');
  if (profileId) {
    invalidate(`professional-profile::profile::${profileId}`);
  }
}

// PROFILE MUTATIONS
export function useCreateProfile() {
  return useAsyncAction(
    (data: CreateProfessionalProfileDTO) => professionalProfileService.createProfile(data),
    {
      onSuccess: (profile) => {
        invalidate('professional-profile::me');
        setCached<CachedRecord<typeof profile>>(cacheKey('professional-profile', 'me'), {
          data: profile,
          fetchedAt: Date.now(),
        });
        toast.success('Perfil profesional creado correctamente');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Error al crear perfil profesional';
        toast.error(message);
        console.error('[useCreateProfile] Error:', error);
      },
    }
  );
}

export function useUpdateProfile() {
  return useAsyncAction(
    ({ profileId, data }: { profileId: string; data: UpdateProfessionalProfileDTO }) =>
      professionalProfileService.updateProfile(profileId, data),
    {
      onSuccess: (updatedProfile) => {
        invalidateAll(updatedProfile.id);
        setCached<CachedRecord<typeof updatedProfile>>(cacheKey('professional-profile', 'me'), {
          data: updatedProfile,
          fetchedAt: Date.now(),
        });
        setCached<CachedRecord<typeof updatedProfile>>(
          cacheKey('professional-profile', 'profile', updatedProfile.id),
          { data: updatedProfile, fetchedAt: Date.now() }
        );
        toast.success('Perfil actualizado correctamente');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Error al actualizar perfil';
        toast.error(message);
        console.error('[useUpdateProfile] Error:', error);
      },
    }
  );
}

export function useDeleteProfile() {
  return useAsyncAction(
    (profileId: string) => professionalProfileService.deleteProfile(profileId),
    {
      onSuccess: () => {
        invalidate('professional-profile');
        toast.success('Perfil profesional eliminado');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Error al eliminar perfil';
        toast.error(message);
        console.error('[useDeleteProfile] Error:', error);
      },
    }
  );
}

// TITLES
export function useAddTitle() {
  return useAsyncAction(
    ({ profileId, data }: { profileId: string; data: TitleFormData }) =>
      professionalProfileService.addTitle(profileId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Título agregado correctamente');
      },
      onError: (error: any) => {
        toast.error('Error al agregar título');
        console.error('[useAddTitle] Error:', error);
      },
    }
  );
}

export function useUpdateTitle() {
  return useAsyncAction(
    ({ profileId, titleId, data }: { profileId: string; titleId: string; data: TitleFormData }) =>
      professionalProfileService.updateTitle(profileId, titleId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Título actualizado correctamente');
      },
      onError: (error: any) => {
        toast.error('Error al actualizar título');
        console.error('[useUpdateTitle] Error:', error);
      },
    }
  );
}

export function useDeleteTitle() {
  return useAsyncAction(
    ({ profileId, titleId }: { profileId: string; titleId: string }) =>
      professionalProfileService.deleteTitle(profileId, titleId),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Título eliminado');
      },
      onError: (error: any) => {
        toast.error('Error al eliminar título');
        console.error('[useDeleteTitle] Error:', error);
      },
    }
  );
}

// STUDIES
export function useAddStudy() {
  return useAsyncAction(
    ({ profileId, data }: { profileId: string; data: StudyFormData }) =>
      professionalProfileService.addStudy(profileId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Estudio agregado correctamente');
      },
      onError: () => { toast.error('Error al agregar estudio'); },
    }
  );
}

export function useUpdateStudy() {
  return useAsyncAction(
    ({ profileId, studyId, data }: { profileId: string; studyId: string; data: StudyFormData }) =>
      professionalProfileService.updateStudy(profileId, studyId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Estudio actualizado correctamente');
      },
      onError: () => { toast.error('Error al actualizar estudio'); },
    }
  );
}

export function useDeleteStudy() {
  return useAsyncAction(
    ({ profileId, studyId }: { profileId: string; studyId: string }) =>
      professionalProfileService.deleteStudy(profileId, studyId),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Estudio eliminado');
      },
      onError: () => { toast.error('Error al eliminar estudio'); },
    }
  );
}

// EXPERIENCE
export function useAddExperience() {
  return useAsyncAction(
    ({ profileId, data }: { profileId: string; data: ExperienceFormData }) =>
      professionalProfileService.addExperience(profileId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Experiencia agregada correctamente');
      },
      onError: () => { toast.error('Error al agregar experiencia'); },
    }
  );
}

export function useUpdateExperience() {
  return useAsyncAction(
    ({
      profileId,
      experienceId,
      data,
    }: {
      profileId: string;
      experienceId: string;
      data: ExperienceFormData;
    }) => professionalProfileService.updateExperience(profileId, experienceId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Experiencia actualizada correctamente');
      },
      onError: () => { toast.error('Error al actualizar experiencia'); },
    }
  );
}

export function useDeleteExperience() {
  return useAsyncAction(
    ({ profileId, experienceId }: { profileId: string; experienceId: string }) =>
      professionalProfileService.deleteExperience(profileId, experienceId),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Experiencia eliminada');
      },
      onError: () => { toast.error('Error al eliminar experiencia'); },
    }
  );
}

// SKILLS
export function useAddSkill() {
  return useAsyncAction(
    ({ profileId, data }: { profileId: string; data: SkillFormData }) =>
      professionalProfileService.addSkill(profileId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Habilidad agregada correctamente');
      },
      onError: () => { toast.error('Error al agregar habilidad'); },
    }
  );
}

export function useUpdateSkill() {
  return useAsyncAction(
    ({ profileId, skillId, data }: { profileId: string; skillId: string; data: SkillFormData }) =>
      professionalProfileService.updateSkill(profileId, skillId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Habilidad actualizada correctamente');
      },
      onError: () => { toast.error('Error al actualizar habilidad'); },
    }
  );
}

export function useDeleteSkill() {
  return useAsyncAction(
    ({ profileId, skillId }: { profileId: string; skillId: string }) =>
      professionalProfileService.deleteSkill(profileId, skillId),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Habilidad eliminada');
      },
      onError: () => { toast.error('Error al eliminar habilidad'); },
    }
  );
}

// LANGUAGES
export function useAddLanguage() {
  return useAsyncAction(
    ({ profileId, data }: { profileId: string; data: LanguageFormData }) =>
      professionalProfileService.addLanguage(profileId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Idioma agregado correctamente');
      },
      onError: () => { toast.error('Error al agregar idioma'); },
    }
  );
}

export function useUpdateLanguage() {
  return useAsyncAction(
    ({
      profileId,
      languageId,
      data,
    }: {
      profileId: string;
      languageId: string;
      data: LanguageFormData;
    }) => professionalProfileService.updateLanguage(profileId, languageId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Idioma actualizado correctamente');
      },
      onError: () => { toast.error('Error al actualizar idioma'); },
    }
  );
}

export function useDeleteLanguage() {
  return useAsyncAction(
    ({ profileId, languageId }: { profileId: string; languageId: string }) =>
      professionalProfileService.deleteLanguage(profileId, languageId),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Idioma eliminado');
      },
      onError: () => { toast.error('Error al eliminar idioma'); },
    }
  );
}

// LICENSES
export function useAddLicense() {
  return useAsyncAction(
    ({ profileId, data }: { profileId: string; data: LicenseFormData }) =>
      professionalProfileService.addLicense(profileId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Licencia agregada correctamente');
      },
      onError: () => { toast.error('Error al agregar licencia'); },
    }
  );
}

export function useUpdateLicense() {
  return useAsyncAction(
    ({
      profileId,
      licenseId,
      data,
    }: {
      profileId: string;
      licenseId: string;
      data: LicenseFormData;
    }) => professionalProfileService.updateLicense(profileId, licenseId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Licencia actualizada correctamente');
      },
      onError: () => { toast.error('Error al actualizar licencia'); },
    }
  );
}

export function useDeleteLicense() {
  return useAsyncAction(
    ({ profileId, licenseId }: { profileId: string; licenseId: string }) =>
      professionalProfileService.deleteLicense(profileId, licenseId),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Licencia eliminada');
      },
      onError: () => { toast.error('Error al eliminar licencia'); },
    }
  );
}

// ASSOCIATIONS
export function useAddAssociation() {
  return useAsyncAction(
    ({ profileId, data }: { profileId: string; data: AssociationFormData }) =>
      professionalProfileService.addAssociation(profileId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Asociación agregada correctamente');
      },
      onError: () => { toast.error('Error al agregar asociación'); },
    }
  );
}

export function useUpdateAssociation() {
  return useAsyncAction(
    ({
      profileId,
      associationId,
      data,
    }: {
      profileId: string;
      associationId: string;
      data: AssociationFormData;
    }) => professionalProfileService.updateAssociation(profileId, associationId, data),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Asociación actualizada correctamente');
      },
      onError: () => { toast.error('Error al actualizar asociación'); },
    }
  );
}

export function useDeleteAssociation() {
  return useAsyncAction(
    ({ profileId, associationId }: { profileId: string; associationId: string }) =>
      professionalProfileService.deleteAssociation(profileId, associationId),
    {
      onSuccess: (_, { profileId }) => {
        invalidateAll(profileId);
        toast.success('Asociación eliminada');
      },
      onError: () => { toast.error('Error al eliminar asociación'); },
    }
  );
}
