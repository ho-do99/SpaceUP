import { beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadImage } from '@/api/fileApi'
import { attachRequestImage, deleteRequestImage } from '@/api/requestApi'
import { replaceRequestImage, uploadAndAttachRequestImage } from './requestImageFlow'

vi.mock('@/api/fileApi', () => ({ uploadImage: vi.fn() }))
vi.mock('@/api/requestApi', () => ({ attachRequestImage: vi.fn(), deleteRequestImage: vi.fn() }))

const upload = vi.mocked(uploadImage)
const attach = vi.mocked(attachRequestImage)
const remove = vi.mocked(deleteRequestImage)
const file = new File(['image'], 'room.png', { type: 'image/png' })

describe('request image upload flows', () => {
  beforeEach(() => {
    upload.mockReset()
    attach.mockReset()
    remove.mockReset()
  })

  it('returns the exact image id created for a floor plan', async () => {
    upload.mockResolvedValue({ imageUrl: '/api/files/images/floor.png' })
    attach.mockResolvedValue(91)

    await expect(uploadAndAttachRequestImage(17, file, 'FLOOR_PLAN')).resolves.toEqual({ id: 91, imageUrl: '/api/files/images/floor.png' })
    expect(attach).toHaveBeenCalledWith(17, { imageType: 'FLOOR_PLAN', imageUrl: '/api/files/images/floor.png' })
  })

  it('uploads and attaches a replacement photo before deleting the exact old image', async () => {
    const calls: string[] = []
    upload.mockImplementation(async () => { calls.push('upload'); return { imageUrl: '/api/files/images/new.png' } })
    attach.mockImplementation(async () => { calls.push('attach'); return 92 })
    remove.mockImplementation(async () => { calls.push('delete') })

    await expect(replaceRequestImage(17, 41, file, 'PHOTO')).resolves.toEqual({ id: 92, imageUrl: '/api/files/images/new.png' })
    expect(calls).toEqual(['upload', 'attach', 'delete'])
    expect(remove).toHaveBeenCalledWith(17, 41)
  })

  it('does not delete the existing photo when the new upload fails', async () => {
    upload.mockRejectedValue(new Error('upload failed'))

    await expect(replaceRequestImage(17, 41, file, 'PHOTO')).rejects.toThrow('upload failed')
    expect(attach).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })
})
