/**
 * Professional Profile Service
 *
 * Servicio para interactuar con los endpoints del perfil profesional
 */

import { getAxiosInstance } from '@/lib/axios/axiosInstance'
import type {
  Association,
  AssociationFormData,
  CreateProfessionalProfileDTO,
  Experience,
  ExperienceFormData,
  Language,
  LanguageFormData,
  License,
  LicenseFormData,
  ProfessionalProfile,
  Skill,
  SkillFormData,
  Study,
  StudyFormData,
  Title,
  TitleFormData,
  UpdateProfessionalProfileDTO,
} from '../interfaces/professional-profile.interfaces'

class ProfessionalProfileService {
  private readonly axios = getAxiosInstance()
  private readonly baseUrl = '/api/professional-profile'

  // ============================================================================
  // PROFILE CRUD
  // ============================================================================

  /**
   * Obtener todos los perfiles profesionales públicos
   */
  async getAllProfiles(limit: number = 50, offset: number = 0): Promise<{ profiles: ProfessionalProfile[]; total: number }> {
    try {
      const response = await this.axios.get<{ profiles: ProfessionalProfile[]; total: number }>(
        `${this.baseUrl}?limit=${limit}&offset=${offset}`
      )
      return response.data
    } catch (error: any) {
      console.error('[ProfessionalProfileService] Error getting all profiles:', error)
      throw error
    }
  }

  /**
   * Obtener el perfil profesional del usuario actual
   */
  async getMyProfile(): Promise<ProfessionalProfile | null> {
    try {
      const response = await this.axios.get<ProfessionalProfile>(`${this.baseUrl}/me`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      console.error('[ProfessionalProfileService] Error getting my profile:', error)
      throw error
    }
  }

  /**
   * Obtener el perfil profesional por ID de usuario
   */
  async getProfileByUserId(userId: string): Promise<ProfessionalProfile | null> {
    try {
      const response = await this.axios.get<ProfessionalProfile>(`${this.baseUrl}/user/${userId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      console.error('[ProfessionalProfileService] Error getting profile by userId:', error)
      throw error
    }
  }

  /**
   * Obtener el perfil profesional por username (SEO-friendly)
   */
  async getProfileByUsername(username: string): Promise<ProfessionalProfile | null> {
    try {
      const response = await this.axios.get<ProfessionalProfile>(`${this.baseUrl}/username/${username}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      console.error('[ProfessionalProfileService] Error getting profile by username:', error)
      throw error
    }
  }

  /**
   * Obtener el perfil profesional por ID
   */
  async getProfileById(profileId: string): Promise<ProfessionalProfile | null> {
    try {
      const response = await this.axios.get<ProfessionalProfile>(`${this.baseUrl}/${profileId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      console.error('[ProfessionalProfileService] Error getting profile:', error)
      throw error
    }
  }

  /**
   * Crear perfil profesional
   */
  async createProfile(data: CreateProfessionalProfileDTO): Promise<ProfessionalProfile> {
    try {
      const response = await this.axios.post<ProfessionalProfile>(this.baseUrl, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error creating profile:', error)
      throw error
    }
  }

  /**
   * Actualizar perfil profesional
   */
  async updateProfile(profileId: string, data: UpdateProfessionalProfileDTO): Promise<ProfessionalProfile> {
    try {
      const response = await this.axios.put<ProfessionalProfile>(`${this.baseUrl}/${profileId}`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error updating profile:', error)
      throw error
    }
  }

  /**
   * Eliminar perfil profesional
   */
  async deleteProfile(profileId: string): Promise<void> {
    try {
      await this.axios.delete(`${this.baseUrl}/${profileId}`)
    } catch (error) {
      console.error('[ProfessionalProfileService] Error deleting profile:', error)
      throw error
    }
  }

  // ============================================================================
  // TITLES
  // ============================================================================

  async getTitles(profileId: string): Promise<Title[]> {
    try {
      const response = await this.axios.get<Title[]>(`${this.baseUrl}/${profileId}/titles`)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error getting titles:', error)
      throw error
    }
  }

  async addTitle(profileId: string, data: TitleFormData): Promise<Title> {
    try {
      const response = await this.axios.post<Title>(`${this.baseUrl}/${profileId}/titles`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error adding title:', error)
      throw error
    }
  }

  async updateTitle(profileId: string, titleId: string, data: TitleFormData): Promise<Title> {
    try {
      const response = await this.axios.put<Title>(`${this.baseUrl}/${profileId}/titles/${titleId}`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error updating title:', error)
      throw error
    }
  }

  async deleteTitle(profileId: string, titleId: string): Promise<void> {
    try {
      await this.axios.delete(`${this.baseUrl}/${profileId}/titles/${titleId}`)
    } catch (error) {
      console.error('[ProfessionalProfileService] Error deleting title:', error)
      throw error
    }
  }

  // ============================================================================
  // STUDIES
  // ============================================================================

  async getStudies(profileId: string): Promise<Study[]> {
    try {
      const response = await this.axios.get<Study[]>(`${this.baseUrl}/${profileId}/studies`)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error getting studies:', error)
      throw error
    }
  }

  async addStudy(profileId: string, data: StudyFormData): Promise<Study> {
    try {
      const response = await this.axios.post<Study>(`${this.baseUrl}/${profileId}/studies`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error adding study:', error)
      throw error
    }
  }

  async updateStudy(profileId: string, studyId: string, data: StudyFormData): Promise<Study> {
    try {
      const response = await this.axios.put<Study>(`${this.baseUrl}/${profileId}/studies/${studyId}`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error updating study:', error)
      throw error
    }
  }

  async deleteStudy(profileId: string, studyId: string): Promise<void> {
    try {
      await this.axios.delete(`${this.baseUrl}/${profileId}/studies/${studyId}`)
    } catch (error) {
      console.error('[ProfessionalProfileService] Error deleting study:', error)
      throw error
    }
  }

  // ============================================================================
  // EXPERIENCE
  // ============================================================================

  async getExperience(profileId: string): Promise<Experience[]> {
    try {
      const response = await this.axios.get<Experience[]>(`${this.baseUrl}/${profileId}/experience`)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error getting experience:', error)
      throw error
    }
  }

  async addExperience(profileId: string, data: ExperienceFormData): Promise<Experience> {
    try {
      const response = await this.axios.post<Experience>(`${this.baseUrl}/${profileId}/experience`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error adding experience:', error)
      throw error
    }
  }

  async updateExperience(profileId: string, experienceId: string, data: ExperienceFormData): Promise<Experience> {
    try {
      const response = await this.axios.put<Experience>(
        `${this.baseUrl}/${profileId}/experience/${experienceId}`,
        data
      )
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error updating experience:', error)
      throw error
    }
  }

  async deleteExperience(profileId: string, experienceId: string): Promise<void> {
    try {
      await this.axios.delete(`${this.baseUrl}/${profileId}/experience/${experienceId}`)
    } catch (error) {
      console.error('[ProfessionalProfileService] Error deleting experience:', error)
      throw error
    }
  }

  // ============================================================================
  // SKILLS
  // ============================================================================

  async getSkills(profileId: string): Promise<Skill[]> {
    try {
      const response = await this.axios.get<Skill[]>(`${this.baseUrl}/${profileId}/skills`)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error getting skills:', error)
      throw error
    }
  }

  async addSkill(profileId: string, data: SkillFormData): Promise<Skill> {
    try {
      const response = await this.axios.post<Skill>(`${this.baseUrl}/${profileId}/skills`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error adding skill:', error)
      throw error
    }
  }

  async updateSkill(profileId: string, skillId: string, data: SkillFormData): Promise<Skill> {
    try {
      const response = await this.axios.put<Skill>(`${this.baseUrl}/${profileId}/skills/${skillId}`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error updating skill:', error)
      throw error
    }
  }

  async deleteSkill(profileId: string, skillId: string): Promise<void> {
    try {
      await this.axios.delete(`${this.baseUrl}/${profileId}/skills/${skillId}`)
    } catch (error) {
      console.error('[ProfessionalProfileService] Error deleting skill:', error)
      throw error
    }
  }

  // ============================================================================
  // LANGUAGES
  // ============================================================================

  async getLanguages(profileId: string): Promise<Language[]> {
    try {
      const response = await this.axios.get<Language[]>(`${this.baseUrl}/${profileId}/languages`)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error getting languages:', error)
      throw error
    }
  }

  async addLanguage(profileId: string, data: LanguageFormData): Promise<Language> {
    try {
      const response = await this.axios.post<Language>(`${this.baseUrl}/${profileId}/languages`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error adding language:', error)
      throw error
    }
  }

  async updateLanguage(profileId: string, languageId: string, data: LanguageFormData): Promise<Language> {
    try {
      const response = await this.axios.put<Language>(`${this.baseUrl}/${profileId}/languages/${languageId}`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error updating language:', error)
      throw error
    }
  }

  async deleteLanguage(profileId: string, languageId: string): Promise<void> {
    try {
      await this.axios.delete(`${this.baseUrl}/${profileId}/languages/${languageId}`)
    } catch (error) {
      console.error('[ProfessionalProfileService] Error deleting language:', error)
      throw error
    }
  }

  // ============================================================================
  // LICENSES
  // ============================================================================

  async getLicenses(profileId: string): Promise<License[]> {
    try {
      const response = await this.axios.get<License[]>(`${this.baseUrl}/${profileId}/licenses`)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error getting licenses:', error)
      throw error
    }
  }

  async addLicense(profileId: string, data: LicenseFormData): Promise<License> {
    try {
      const response = await this.axios.post<License>(`${this.baseUrl}/${profileId}/licenses`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error adding license:', error)
      throw error
    }
  }

  async updateLicense(profileId: string, licenseId: string, data: LicenseFormData): Promise<License> {
    try {
      const response = await this.axios.put<License>(`${this.baseUrl}/${profileId}/licenses/${licenseId}`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error updating license:', error)
      throw error
    }
  }

  async deleteLicense(profileId: string, licenseId: string): Promise<void> {
    try {
      await this.axios.delete(`${this.baseUrl}/${profileId}/licenses/${licenseId}`)
    } catch (error) {
      console.error('[ProfessionalProfileService] Error deleting license:', error)
      throw error
    }
  }

  // ============================================================================
  // ASSOCIATIONS
  // ============================================================================

  async getAssociations(profileId: string): Promise<Association[]> {
    try {
      const response = await this.axios.get<Association[]>(`${this.baseUrl}/${profileId}/associations`)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error getting associations:', error)
      throw error
    }
  }

  async addAssociation(profileId: string, data: AssociationFormData): Promise<Association> {
    try {
      const response = await this.axios.post<Association>(`${this.baseUrl}/${profileId}/associations`, data)
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error adding association:', error)
      throw error
    }
  }

  async updateAssociation(profileId: string, associationId: string, data: AssociationFormData): Promise<Association> {
    try {
      const response = await this.axios.put<Association>(
        `${this.baseUrl}/${profileId}/associations/${associationId}`,
        data
      )
      return response.data
    } catch (error) {
      console.error('[ProfessionalProfileService] Error updating association:', error)
      throw error
    }
  }

  async deleteAssociation(profileId: string, associationId: string): Promise<void> {
    try {
      await this.axios.delete(`${this.baseUrl}/${profileId}/associations/${associationId}`)
    } catch (error) {
      console.error('[ProfessionalProfileService] Error deleting association:', error)
      throw error
    }
  }

  // ============================================================================
  // FOLLOWERS
  // ============================================================================

  /**
   * Seguir un perfil profesional
   */
  async followProfile(profileId: string): Promise<void> {
    try {
      await this.axios.post(`${this.baseUrl}/${profileId}/follow`)
    } catch (error) {
      console.error('[ProfessionalProfileService] Error following profile:', error)
      throw error
    }
  }

  /**
   * Dejar de seguir un perfil profesional
   */
  async unfollowProfile(profileId: string): Promise<void> {
    try {
      await this.axios.delete(`${this.baseUrl}/${profileId}/follow`)
    } catch (error) {
      console.error('[ProfessionalProfileService] Error unfollowing profile:', error)
      throw error
    }
  }

  /**
   * Verificar si el usuario autenticado sigue un perfil
   */
  async checkFollowStatus(profileId: string): Promise<boolean> {
    try {
      const response = await this.axios.get<{ isFollowing: boolean }>(
        `${this.baseUrl}/${profileId}/follow/status`
      )
      return response.data.isFollowing
    } catch (error) {
      console.error('[ProfessionalProfileService] Error checking follow status:', error)
      throw error
    }
  }
}

export const professionalProfileService = new ProfessionalProfileService()
