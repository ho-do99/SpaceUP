const DAUM_POSTCODE_SCRIPT_ID = 'daum-postcode-script'
export const DAUM_POSTCODE_SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

interface DaumPostcodeData {
  userSelectedType?: 'R' | 'J'
  roadAddress: string
  jibunAddress: string
  bname?: string
  buildingName?: string
  apartment?: 'Y' | 'N'
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void
  onclose?: () => void
}

interface DaumPostcodeInstance {
  open: (options?: { q?: string }) => void
}

export interface SelectedAddress {
  roadAddress: string
  lotAddress: string
  buildingName: string
  displayAddress: string
}

type DaumPostcodeConstructor = new (options: DaumPostcodeOptions) => DaumPostcodeInstance

declare global {
  interface Window {
    daum?: {
      Postcode: DaumPostcodeConstructor
    }
  }
}

let loadPromise: Promise<void> | null = null

export function loadDaumPostcodeScript(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(DAUM_POSTCODE_SCRIPT_ID) as HTMLScriptElement | null
    const script = existingScript ?? document.createElement('script')

    const handleLoad = () => {
      cleanupListeners()
      if (window.daum?.Postcode) {
        resolve()
      } else {
        loadPromise = null
        reject(new Error('Daum 우편번호 서비스를 사용할 수 없습니다.'))
      }
    }
    const handleError = () => {
      cleanupListeners()
      if (!existingScript) script.remove()
      loadPromise = null
      reject(new Error('Daum 우편번호 서비스를 불러오지 못했습니다.'))
    }
    const cleanupListeners = () => {
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
    }

    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)

    if (!existingScript) {
      script.id = DAUM_POSTCODE_SCRIPT_ID
      script.src = DAUM_POSTCODE_SCRIPT_URL
      script.async = true
      document.head.appendChild(script)
    }
  })

  return loadPromise
}

export function formatDaumPostcodeAddress(data: DaumPostcodeData): string {
  if (data.userSelectedType !== 'J' && data.roadAddress) {
    const extraAddress: string[] = []
    if (data.bname && /[동로가]$/.test(data.bname)) extraAddress.push(data.bname)
    if (data.buildingName && data.apartment === 'Y') extraAddress.push(data.buildingName)
    return extraAddress.length > 0
      ? `${data.roadAddress} (${extraAddress.join(', ')})`
      : data.roadAddress
  }
  return data.jibunAddress || data.roadAddress
}

function toSelectedAddress(data: DaumPostcodeData): SelectedAddress {
  const roadAddress = data.roadAddress || data.jibunAddress
  const lotAddress = data.jibunAddress || data.roadAddress
  const buildingName = data.buildingName?.trim() ?? ''
  return {
    roadAddress,
    lotAddress,
    buildingName,
    displayAddress: buildingName ? `${roadAddress} (${buildingName})` : roadAddress,
  }
}

export async function searchDaumAddress(query: string): Promise<SelectedAddress | null> {
  await loadDaumPostcodeScript()
  const Postcode = window.daum?.Postcode
  if (!Postcode) throw new Error('Daum 우편번호 서비스를 사용할 수 없습니다.')

  return new Promise<SelectedAddress | null>((resolve, reject) => {
    let completed = false
    try {
      const postcode = new Postcode({
        oncomplete: (data) => {
          completed = true
          resolve(toSelectedAddress(data))
        },
        onclose: () => { if (!completed) resolve(null) },
      })
      postcode.open({ q: query.trim() })
    } catch {
      reject(new Error('Daum 우편번호 검색창을 열지 못했습니다.'))
    }
  })
}

export async function openDaumPostcode(): Promise<string | null> {
  await loadDaumPostcodeScript()
  const Postcode = window.daum?.Postcode
  if (!Postcode) throw new Error('Daum 우편번호 서비스를 사용할 수 없습니다.')

  return new Promise<string | null>((resolve, reject) => {
    let completed = false
    try {
      const postcode = new Postcode({
        oncomplete: (data) => {
          completed = true
          resolve(formatDaumPostcodeAddress(data))
        },
        onclose: () => {
          if (!completed) resolve(null)
        },
      })
      postcode.open()
    } catch {
      reject(new Error('Daum 우편번호 검색창을 열지 못했습니다.'))
    }
  })
}
