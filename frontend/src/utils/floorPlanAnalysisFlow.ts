import type { LinkedRequestImage } from '@/utils/requestImageFlow'

export interface FloorPlanAnalysisNavigationState {
  mode: 'multipart'
  floorPlanFile: File
  uploadedImagePath: string
  uploadedImageUrl: string
  originalFileName: string
}

export interface StoredFloorPlanAnalysisNavigationState {
  mode: 'storage'
  floorPlanVariantId: number
  analysisJobId: number
}

export type FloorPlanAnalysisState = FloorPlanAnalysisNavigationState | StoredFloorPlanAnalysisNavigationState

const STORAGE_ANALYSIS_KEY = 'spaceup.floorPlanStorageAnalysis'

export function createFloorPlanAnalysisNavigationState(
  file: File,
  linkedImage: LinkedRequestImage,
  uploadedImageUrl: string,
): FloorPlanAnalysisNavigationState {
  return {
    mode: 'multipart',
    floorPlanFile: file,
    uploadedImagePath: linkedImage.imageUrl,
    uploadedImageUrl,
    originalFileName: file.name,
  }
}

export function createStoredFloorPlanAnalysisState(floorPlanVariantId: number, analysisJobId: number): StoredFloorPlanAnalysisNavigationState {
  const state = { mode: 'storage' as const, floorPlanVariantId, analysisJobId }
  sessionStorage.setItem(STORAGE_ANALYSIS_KEY, JSON.stringify(state))
  return state
}

export function clearStoredFloorPlanAnalysisState() {
  sessionStorage.removeItem(STORAGE_ANALYSIS_KEY)
}

export function getFloorPlanAnalysisNavigationState(
  value: unknown,
): FloorPlanAnalysisState | null {
  if (typeof value !== 'object' || value === null) return null

  const mode = (value as { mode?: unknown }).mode

  if (mode === 'storage') {
    const stored = value as Partial<StoredFloorPlanAnalysisNavigationState>
    return Number.isSafeInteger(stored.floorPlanVariantId) && Number(stored.floorPlanVariantId) > 0 &&
      Number.isSafeInteger(stored.analysisJobId) && Number(stored.analysisJobId) > 0
      ? stored as StoredFloorPlanAnalysisNavigationState : null
  }

  const candidate = value as Partial<FloorPlanAnalysisNavigationState>
  if (
    mode !== 'multipart' || !(candidate.floorPlanFile instanceof File) ||
    typeof candidate.uploadedImagePath !== 'string' ||
    typeof candidate.uploadedImageUrl !== 'string' ||
    typeof candidate.originalFileName !== 'string'
  ) {
    return null
  }

  return candidate as FloorPlanAnalysisNavigationState
}

export function getStoredFloorPlanAnalysisState(): StoredFloorPlanAnalysisNavigationState | null {
  const value = sessionStorage.getItem(STORAGE_ANALYSIS_KEY)
  if (!value) return null
  try { return getFloorPlanAnalysisNavigationState(JSON.parse(value)) as StoredFloorPlanAnalysisNavigationState | null } catch { return null }
}
