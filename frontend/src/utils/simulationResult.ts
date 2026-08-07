const SIMULATION_RESULT_KEY = 'spaceup.simulationResult'

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
