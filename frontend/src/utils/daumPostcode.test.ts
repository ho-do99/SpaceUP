import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type PostcodeOptions = {
  oncomplete: (data: {
    userSelectedType?: 'R' | 'J'
    roadAddress: string
    jibunAddress: string
    bname?: string
    buildingName?: string
    apartment?: 'Y' | 'N'
  }) => void
  onclose?: () => void
}

type PostcodeOpenOptions = { q?: string }

describe('Daum postcode integration', () => {
  beforeEach(() => {
    vi.resetModules()
    document.getElementById('daum-postcode-script')?.remove()
    delete window.daum
  })

  afterEach(() => {
    document.getElementById('daum-postcode-script')?.remove()
    delete window.daum
  })

  it('loads the official script only once for concurrent requests', async () => {
    const { loadDaumPostcodeScript, DAUM_POSTCODE_SCRIPT_URL } = await import('./daumPostcode')
    const first = loadDaumPostcodeScript()
    const second = loadDaumPostcodeScript()
    const script = document.getElementById('daum-postcode-script') as HTMLScriptElement

    expect(document.querySelectorAll('#daum-postcode-script')).toHaveLength(1)
    expect(script.src).toBe(DAUM_POSTCODE_SCRIPT_URL)

    window.daum = { Postcode: class { open() {} } }
    script.dispatchEvent(new Event('load'))
    await expect(Promise.all([first, second])).resolves.toEqual([undefined, undefined])
  })

  it('returns the selected road address and its official extra address', async () => {
    let options: PostcodeOptions | undefined
    window.daum = {
      Postcode: class {
        constructor(receivedOptions: PostcodeOptions) {
          options = receivedOptions
        }
        open() {
          options?.oncomplete({
            userSelectedType: 'R',
            roadAddress: '광주광역시 서구 상무중앙로 1',
            jibunAddress: '광주광역시 서구 치평동 1',
            bname: '치평동',
          })
        }
      },
    }
    const { openDaumPostcode } = await import('./daumPostcode')
    await expect(openDaumPostcode()).resolves.toBe('광주광역시 서구 상무중앙로 1 (치평동)')
  })

  it('opens with the entered query and returns structured address data for catalog matching', async () => {
    let options: PostcodeOptions | undefined
    let openOptions: PostcodeOpenOptions | undefined
    window.daum = {
      Postcode: class {
        constructor(receivedOptions: PostcodeOptions) {
          options = receivedOptions
        }
        open(receivedOpenOptions?: PostcodeOpenOptions) {
          openOptions = receivedOpenOptions
          options?.oncomplete({
            userSelectedType: 'R',
            roadAddress: '광주광역시 서구 상무중앙로 100',
            jibunAddress: '광주광역시 서구 치평동 1234',
            buildingName: '상무센트럴아파트',
            apartment: 'Y',
          })
        }
      },
    }

    const { searchDaumAddress } = await import('./daumPostcode')
    await expect(searchDaumAddress('상무센트럴')).resolves.toEqual({
      roadAddress: '광주광역시 서구 상무중앙로 100',
      lotAddress: '광주광역시 서구 치평동 1234',
      buildingName: '상무센트럴아파트',
      displayAddress: '광주광역시 서구 상무중앙로 100 (상무센트럴아파트)',
    })
    expect(openOptions).toEqual({ q: '상무센트럴' })
  })

  it('rejects a script load failure without crashing the page runtime', async () => {
    const { loadDaumPostcodeScript } = await import('./daumPostcode')
    const loading = loadDaumPostcodeScript()
    const script = document.getElementById('daum-postcode-script') as HTMLScriptElement
    script.dispatchEvent(new Event('error'))
    await expect(loading).rejects.toThrow('불러오지 못했습니다')
    expect(document.getElementById('daum-postcode-script')).toBeNull()
  })
})
