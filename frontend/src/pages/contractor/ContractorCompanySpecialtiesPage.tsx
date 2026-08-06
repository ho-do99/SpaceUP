import { useState } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorCompanyTabs from '@/components/contractor/ContractorCompanyTabs'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'

type RepresentativeSpecialty =
  | 'full_remodeling'
  | 'wallpaper'
  | 'floor'

type DetailedSpecialty =
  | 'full_interior'
  | 'wallpaper_work'
  | 'floor_work'

interface RepresentativeSpecialtyOption {
  id: RepresentativeSpecialty
  label: string
}

interface DetailedSpecialtyOption {
  id: DetailedSpecialty
  label: string
}

const representativeSpecialtyOptions: readonly RepresentativeSpecialtyOption[] =
  [
    {
      id: 'full_remodeling',
      label: '전체 리모델링',
    },
    {
      id: 'wallpaper',
      label: '도배',
    },
    {
      id: 'floor',
      label: '바닥',
    },
  ]

const detailedSpecialtyOptions: readonly DetailedSpecialtyOption[] = [
  {
    id: 'full_interior',
    label: '전체 인테리어',
  },
  {
    id: 'wallpaper_work',
    label: '벽지·도배',
  },
  {
    id: 'floor_work',
    label: '장판·마루',
  },
]

export default function ContractorCompanySpecialtiesPage() {
  const [representativeSpecialties, setRepresentativeSpecialties] =
    useState<RepresentativeSpecialty[]>([
      'full_remodeling',
      'wallpaper',
      'floor',
    ])

  const [detailedSpecialties, setDetailedSpecialties] =
    useState<DetailedSpecialty[]>([
      'full_interior',
      'wallpaper_work',
      'floor_work',
    ])

  const [saveMessage, setSaveMessage] = useState('')

  const toggleRepresentativeSpecialty = (
    specialty: RepresentativeSpecialty,
  ) => {
    setSaveMessage('')

    setRepresentativeSpecialties((current) => {
      const isSelected = current.includes(specialty)

      if (isSelected) {
        return current.filter((item) => item !== specialty)
      }

      if (current.length >= 3) {
        return current
      }

      return [...current, specialty]
    })
  }

  const toggleDetailedSpecialty = (
    specialty: DetailedSpecialty,
  ) => {
    setSaveMessage('')

    setDetailedSpecialties((current) => {
      const isSelected = current.includes(specialty)

      if (isSelected) {
        return current.filter((item) => item !== specialty)
      }

      return [...current, specialty]
    })
  }

  const handleSave = () => {
    setSaveMessage('전문 분야가 저장되었습니다.')
  }

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="업체 정보" />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <p className="text-xs leading-[17px] text-[#64748b]">
          시공 가능한 전문 분야와 대표 서비스를 설정하세요.
        </p>

        <div className="mt-2">
          <ContractorCompanyTabs activeTab="specialties" />
        </div>

        <section
          className="mt-3"
          aria-labelledby="representative-specialty-title"
        >
          <h2
            id="representative-specialty-title"
            className="text-sm font-bold text-[#1e293b]"
          >
            대표 전문 분야
          </h2>

          <p className="mt-1 text-[11px] leading-4 text-[#64748b]">
            최대 3개까지 대표 전문 분야로 선택할 수 있습니다.
          </p>

          <div
            className="mt-4 flex flex-wrap gap-2"
            aria-label="대표 전문 분야 선택"
          >
            {representativeSpecialtyOptions.map((specialty) => {
              const isSelected =
                representativeSpecialties.includes(specialty.id)

              return (
                <button
                  key={specialty.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    toggleRepresentativeSpecialty(specialty.id)
                  }
                  className={`flex h-9 items-center justify-center rounded-full border px-4 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
                    isSelected
                      ? 'border-[#2563eb] bg-[#2563eb] text-white'
                      : 'border-[#e2e8f0] bg-white text-[#64748b]'
                  }`}
                >
                  {specialty.label}
                </button>
              )
            })}
          </div>
        </section>

        <section
          className="mt-16"
          aria-labelledby="detailed-specialty-title"
        >
          <h2
            id="detailed-specialty-title"
            className="text-sm font-bold text-[#1e293b]"
          >
            세부 시공 분야
          </h2>

          <div
            className="mt-3 space-y-2"
            aria-label="세부 시공 분야 선택"
          >
            {detailedSpecialtyOptions.map((specialty) => {
              const isSelected =
                detailedSpecialties.includes(specialty.id)

              return (
                <button
                  key={specialty.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    toggleDetailedSpecialty(specialty.id)
                  }
                  className="flex h-12 w-full items-center gap-3 rounded-[10px] border border-[#e2e8f0] bg-white px-[13px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border text-[13px] font-bold ${
                      isSelected
                        ? 'border-[#2563eb] bg-[#2563eb] text-white'
                        : 'border-[#cbd5e1] bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </span>

                  <span className="text-[13px] font-bold text-[#1e293b]">
                    {specialty.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={handleSave}
          className="mt-60 h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
        >
          전문 분야 저장
        </button>

        <p
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {saveMessage}
        </p>
      </main>

      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}