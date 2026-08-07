import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearSimulationResult,
  getSimulationResult,
  parseSimulationResult,
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
})
