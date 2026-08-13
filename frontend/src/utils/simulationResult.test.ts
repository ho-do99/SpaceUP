import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearSimulationResult,
  getSimulationGenerationContext,
  getSimulationResult,
  parseSimulationResult,
  saveSimulationGenerationContext,
  saveSimulationResult,
  type SimulationResultState,
} from './simulationResult'

const result: SimulationResultState = {
  requestId: 7,
  styleId: 'modern',
  beforeImageUrl: 'https://spaceup.duckdns.org/api/files/images/before.jpg',
  afterImagePath: '/api/files/images/after.jpg',
  afterImageUrl: 'https://spaceup.duckdns.org/api/files/images/after.jpg',
}

describe('simulationResult', () => {
  beforeEach(() => sessionStorage.clear())

  it('keeps the latest generated image across result-page navigation', () => {
    saveSimulationResult(result)
    expect(getSimulationResult()).toEqual(result)
    clearSimulationResult()
    expect(getSimulationResult()).toBeNull()
  })

  it('rejects incomplete route state', () => {
    expect(parseSimulationResult({ requestId: 7, styleId: 'modern' })).toBeNull()
  })

  it('restores generation context without storing a File', () => {
    const context = {
      requestId: 7,
      styleId: 'modern',
      uploadedImagePath: '/api/files/images/room.png',
      uploadedImageUrl: 'https://spaceup.test/api/files/images/room.png',
    }
    saveSimulationGenerationContext(context)
    expect(getSimulationGenerationContext()).toEqual(context)
    expect(sessionStorage.getItem('spaceup.simulationGenerationContext')).not.toContain('File')
  })
})
