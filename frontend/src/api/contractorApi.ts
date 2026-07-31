import axiosInstance from './axiosInstance'
import type { Contractor, ContractorSearchParams } from '@/types/contractor'

export async function searchContractors(
  params: ContractorSearchParams = {},
): Promise<Contractor[]> {
  const response = await axiosInstance.get<Contractor[]>('/contractors', { params })
  return response.data
}

export async function getContractor(id: number): Promise<Contractor> {
  const response = await axiosInstance.get<Contractor>(`/contractors/${id}`)
  return response.data
}
