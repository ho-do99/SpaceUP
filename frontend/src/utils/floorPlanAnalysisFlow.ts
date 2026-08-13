import type { LinkedRequestImage } from '@/utils/requestImageFlow'

export interface FloorPlanAnalysisNavigationState {
  mode: 'multipart'
  floorPlanFile: File
  uploadedImagePath: string
  uploadedImageUrl: string
  originalFileName: string
  analysisJobId: number
}

export interface LinkedFloorPlanAnalysisState {
  mode: 'linked'
  analysisJobId: number
  uploadedImageUrl: string
}

export interface StoredFloorPlanAnalysisNavigationState {
  mode: 'storage'
  floorPlanVariantId: number
  analysisJobId: number
}

export type FloorPlanAnalysisState = FloorPlanAnalysisNavigationState | LinkedFloorPlanAnalysisState | StoredFloorPlanAnalysisNavigationState

const STORAGE_ANALYSIS_KEY = 'spaceup.floorPlanStorageAnalysis'
const LINKED_ANALYSIS_KEY = 'spaceup.floorPlanLinkedAnalysis'

export function createFloorPlanAnalysisNavigationState(
  file: File,
  linkedImage: LinkedRequestImage,
  uploadedImageUrl: string,
  analysisJobId: number,
): FloorPlanAnalysisNavigationState {
  const linkedState: LinkedFloorPlanAnalysisState = { mode: 'linked', analysisJobId, uploadedImageUrl }
  sessionStorage.setItem(LINKED_ANALYSIS_KEY, JSON.stringify(linkedState))
  return {
    mode: 'multipart',
    floorPlanFile: file,
    uploadedImagePath: linkedImage.imageUrl,
    uploadedImageUrl,
    originalFileName: file.name,
    analysisJobId,
  }
}

export function createStoredFloorPlanAnalysisState(floorPlanVariantId: number, analysisJobId: number): StoredFloorPlanAnalysisNavigationState {
  const state = { mode: 'storage' as const, floorPlanVariantId, analysisJobId }
  sessionStorage.setItem(STORAGE_ANALYSIS_KEY, JSON.stringify(state))
  return state
}

export function clearStoredFloorPlanAnalysisState() {
  sessionStorage.removeItem(STORAGE_ANALYSIS_KEY)
  sessionStorage.removeItem(LINKED_ANALYSIS_KEY)
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

  if (mode === 'linked') {
    const linked = value as Partial<LinkedFloorPlanAnalysisState>
    return Number.isSafeInteger(linked.analysisJobId) && Number(linked.analysisJobId) > 0 &&
      typeof linked.uploadedImageUrl === 'string' && Boolean(linked.uploadedImageUrl.trim())
      ? linked as LinkedFloorPlanAnalysisState : null
  }

  const candidate = value as Partial<FloorPlanAnalysisNavigationState>
  if (
    mode !== 'multipart' || !(candidate.floorPlanFile instanceof File) ||
    typeof candidate.uploadedImagePath !== 'string' ||
    typeof candidate.uploadedImageUrl !== 'string' ||
    typeof candidate.originalFileName !== 'string'
    || !Number.isSafeInteger(candidate.analysisJobId) || Number(candidate.analysisJobId) <= 0
  ) {
    return null
  }

  return candidate as FloorPlanAnalysisNavigationState
}

export function getStoredLinkedFloorPlanAnalysisState(): LinkedFloorPlanAnalysisState | null {
  const value = sessionStorage.getItem(LINKED_ANALYSIS_KEY)
  if (!value) return null
  try { return getFloorPlanAnalysisNavigationState(JSON.parse(value)) as LinkedFloorPlanAnalysisState | null } catch { return null }
}

export function getStoredFloorPlanAnalysisState(): StoredFloorPlanAnalysisNavigationState | null {
  const value = sessionStorage.getItem(STORAGE_ANALYSIS_KEY)
  if (!value) return null
  try { return getFloorPlanAnalysisNavigationState(JSON.parse(value)) as StoredFloorPlanAnalysisNavigationState | null } catch { return null }
}
