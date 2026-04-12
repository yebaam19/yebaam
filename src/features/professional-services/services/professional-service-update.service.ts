import { getAxiosInstance } from '@/lib/axios/axiosInstance'
import { ProfessionalService, UpdateProfessionalServiceDTO } from '../interfaces/professional-service.interfaces'

const BASE_URL = '/api/professional-services'

/**
 * Servicio para actualizar servicios profesionales
 */
export class ProfessionalServiceUpdateService {
  private readonly axios = getAxiosInstance()

  /**
   * Actualiza un servicio profesional
   */
  async updateService(
    serviceId: string,
    data: UpdateProfessionalServiceDTO
  ): Promise<ProfessionalService> {
    try {
      const response = await this.axios.put(`${BASE_URL}/${serviceId}`, data)
      return response.data.service
    } catch (error: any) {
      console.error('Error updating service:', error)
      throw new Error(error.response?.data?.message || 'Error al actualizar el servicio')
    }
  }
}
