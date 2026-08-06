export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

export interface ImageUploadResponse {
  imageUrl: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
