import axiosInstance from './axiosInstance'
import type { Estimate, EstimateRequest } from '@/types/estimate'

export async function createEstimate(request: EstimateRequest): Promise<Estimate> {
  const response = await axiosInstance.post<Estimate>('/estimates', request)
  return response.data
}

export async function getEstimate(id: number): Promise<Estimate> {
  const response = await axiosInstance.get<Estimate>(`/estimates/${id}`)
  return response.data
}
