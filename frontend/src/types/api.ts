export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

export interface ImageUploadResponse {
  imageUrl: string
}
