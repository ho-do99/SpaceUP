const SIMULATION_RESULT_KEY = 'spaceup.simulationResult'
const SIMULATION_GENERATION_CONTEXT_KEY = 'spaceup.simulationGenerationContext'

export interface SimulationGenerationContext {
  requestId: number
  styleId: string
  uploadedImagePath: string
  uploadedImageUrl: string
}

export function saveSimulationGenerationContext(context: SimulationGenerationContext) {
  sessionStorage.setItem(SIMULATION_GENERATION_CONTEXT_KEY, JSON.stringify(context))
}

export function getSimulationGenerationContext(): SimulationGenerationContext | null {
  const stored = sessionStorage.getItem(SIMULATION_GENERATION_CONTEXT_KEY)
  if (!stored) return null
  try {
    const value = JSON.parse(stored) as Partial<SimulationGenerationContext>
    return Number.isSafeInteger(value.requestId) && Number(value.requestId) > 0 &&
      typeof value.styleId === 'string' && Boolean(value.styleId) &&
      typeof value.uploadedImagePath === 'string' && Boolean(value.uploadedImagePath) &&
      typeof value.uploadedImageUrl === 'string' && Boolean(value.uploadedImageUrl)
      ? value as SimulationGenerationContext
      : null
  } catch { return null }
}

export interface SimulationResultState {
  requestId: number
  styleId: string
  beforeImageUrl: string
  afterImagePath: string
  afterImageUrl: string
}

export function parseSimulationResult(value: unknown): SimulationResultState | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const result = value as Partial<SimulationResultState>
  const isValid = (
    Number.isSafeInteger(result.requestId) &&
    Number(result.requestId) > 0 &&
    typeof result.styleId === 'string' &&
    typeof result.beforeImageUrl === 'string' &&
    typeof result.afterImagePath === 'string' &&
    typeof result.afterImageUrl === 'string'
  )
  return isValid ? result as SimulationResultState : null
}

export function saveSimulationResult(result: SimulationResultState) {
  sessionStorage.setItem(SIMULATION_RESULT_KEY, JSON.stringify(result))
}

export function getSimulationResult(): SimulationResultState | null {
  const stored = sessionStorage.getItem(SIMULATION_RESULT_KEY)
  if (!stored) return null
  try {
    const parsed: unknown = JSON.parse(stored)
    return parseSimulationResult(parsed)
  } catch {
    return null
  }
}

export function clearSimulationResult() {
  sessionStorage.removeItem(SIMULATION_RESULT_KEY)
}
