import axiosInstance from './axiosInstance'
import type { FloorPlan, FloorPlanAnalysis } from '@/types/floorPlan'

export async function uploadFloorPlan(file: File): Promise<FloorPlan> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post<FloorPlan>('/floorplans', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export async function getFloorPlanAnalysis(id: number): Promise<FloorPlanAnalysis> {
  const response = await axiosInstance.get<FloorPlanAnalysis>(`/analyses/${id}`)
  return response.data
}
