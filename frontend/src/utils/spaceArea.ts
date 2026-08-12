const SQUARE_METERS_PER_PYEONG = 3.305785

function formatSquareMeters(areaM2: number) {
  return areaM2.toLocaleString('ko-KR', {
    maximumFractionDigits: 2,
  })
}

export function formatSpaceArea(areaM2: number | null) {
  if (areaM2 === null) {
    return '면적 산정 제외'
  }

  const areaPyeong = areaM2 / SQUARE_METERS_PER_PYEONG
  return `${formatSquareMeters(areaM2)}㎡ (${areaPyeong.toFixed(2)}평)`
}

interface SpaceAreaValue {
  spaceName: string
  spaceAreaM2?: number | null
}

export function sumSelectedSpaceAreaM2(
  spaces: readonly SpaceAreaValue[],
  selectedSpaceNames: ReadonlySet<string>,
) {
  let hasCalculatedArea = false

  const totalAreaM2 = spaces.reduce((total, space) => {
    if (
      !selectedSpaceNames.has(space.spaceName) ||
      typeof space.spaceAreaM2 !== 'number'
    ) {
      return total
    }

    hasCalculatedArea = true
    return total + space.spaceAreaM2
  }, 0)

  return hasCalculatedArea ? totalAreaM2 : null
}
