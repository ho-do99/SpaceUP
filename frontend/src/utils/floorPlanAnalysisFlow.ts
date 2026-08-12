import type { LinkedRequestImage } from '@/utils/requestImageFlow'

export interface FloorPlanAnalysisNavigationState {
  floorPlanFile: File
  uploadedImagePath: string
  uploadedImageUrl: string
  originalFileName: string
}

export async function assetUrlToFile(
  assetUrl: string,
  fileName: string,
): Promise<File> {
  const response = await fetch(assetUrl)

  if (!response.ok) {
    throw new Error('등록된 평면도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }

  const blob = await response.blob()
  const contentType = blob.type || response.headers.get('content-type') || 'image/png'

  return new File([blob], fileName, { type: contentType })
}

export function createFloorPlanAnalysisNavigationState(
  file: File,
  linkedImage: LinkedRequestImage,
  uploadedImageUrl: string,
): FloorPlanAnalysisNavigationState {
  return {
    floorPlanFile: file,
    uploadedImagePath: linkedImage.imageUrl,
    uploadedImageUrl,
    originalFileName: file.name,
  }
}

export function getFloorPlanAnalysisNavigationState(
  value: unknown,
): FloorPlanAnalysisNavigationState | null {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as Partial<FloorPlanAnalysisNavigationState>

  if (
    !(candidate.floorPlanFile instanceof File) ||
    typeof candidate.uploadedImagePath !== 'string' ||
    typeof candidate.uploadedImageUrl !== 'string' ||
    typeof candidate.originalFileName !== 'string'
  ) {
    return null
  }

  return candidate as FloorPlanAnalysisNavigationState
}
