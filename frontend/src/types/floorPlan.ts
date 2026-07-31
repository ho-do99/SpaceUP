export type AnalysisStatus = 'UPLOADED' | 'ANALYZING' | 'COMPLETED' | 'FAILED'

export interface FloorPlan {
  id: number
  fileName: string
  fileUrl: string
  status: AnalysisStatus
  createdAt: string
}

export interface FloorPlanAnalysis {
  id: number
  floorPlanId: number
  status: AnalysisStatus
  totalAreaSquareMeters?: number
  roomNames: string[]
  ocrText?: string
}
