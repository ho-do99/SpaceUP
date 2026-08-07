import type { InteriorStyleId } from '@/mocks/interiorStyles'
import type { MaterialTheme } from '@/types/materialCatalog'

const MATERIAL_THEME_KEY = 'spaceup-material-theme'

const themeByStyle: Record<InteriorStyleId, MaterialTheme> = {
  modern: 'MODERN',
  wood: 'WOOD',
  white: 'WHITE',
  marble: 'MARBLE',
}

export function saveMaterialTheme(style: InteriorStyleId) {
  sessionStorage.setItem(MATERIAL_THEME_KEY, themeByStyle[style])
}

export function getMaterialTheme(): MaterialTheme {
  const stored = sessionStorage.getItem(MATERIAL_THEME_KEY)
  if (stored === 'WOOD' || stored === 'WHITE' || stored === 'MARBLE') {
    return stored
  }
  return 'MODERN'
}
