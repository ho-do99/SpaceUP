import { uploadImage } from '@/api/fileApi'
import {
  attachRequestImage,
  deleteRequestImage,
} from '@/api/requestApi'
import type { RequestImageType } from '@/types/request'

export interface LinkedRequestImage {
  id: number
  imageUrl: string
}

export async function uploadAndAttachRequestImage(
  requestId: number,
  file: File,
  imageType: RequestImageType,
  signal?: AbortSignal,
): Promise<LinkedRequestImage> {
  const uploaded = await uploadImage(file, signal)
  const id = await attachRequestImage(requestId, {
    imageType,
    imageUrl: uploaded.imageUrl,
  })

  return { id, imageUrl: uploaded.imageUrl }
}

export async function replaceRequestImage(
  requestId: number,
  currentImageId: number,
  file: File,
  imageType: RequestImageType,
  signal?: AbortSignal,
): Promise<LinkedRequestImage> {
  const replacement = await uploadAndAttachRequestImage(
    requestId,
    file,
    imageType,
    signal,
  )

  try {
    await deleteRequestImage(requestId, currentImageId)
  } catch (error) {
    try {
      await deleteRequestImage(requestId, replacement.id)
    } catch {
      // The original deletion error is the actionable failure for the user.
    }
    throw error
  }

  return replacement
}
