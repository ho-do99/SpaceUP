import { useEffect, useState } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import { getMyContractorProfile, updateMyContractorDisclosure } from '@/api/contractorApi'

interface VisibilitySettings {
  profileVisible: boolean
  managerContactVisible: boolean
  specialtiesVisible: boolean
  serviceRegionsVisible: boolean
  portfolioVisible: boolean
  consultationAvailable: boolean
}

interface VisibilitySettingRowProps {
  title: string
  description: string
  checked: boolean
  onChange: () => void
  showDivider?: boolean
}

function VisibilitySettingRow({
  title,
  description,
  checked,
  onChange,
  showDivider = true,
}: VisibilitySettingRowProps) {
  return (
    <div
      className={`flex min-h-[72px] items-center justify-between gap-4 ${
        showDivider ? 'border-b border-[#e2e8f0]' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-[#1e293b]">
          {title}
        </p>

        <p className="mt-1 break-words text-[11px] leading-4 text-[#64748b]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
          checked ? 'bg-[#2563eb]' : 'bg-[#cbd5e1]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked
              ? 'translate-x-[22px]'
              : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

export default function ContractorVisibilitySettingsPage() {
  const [settings, setSettings] = useState<VisibilitySettings>({
    profileVisible: true,
    managerContactVisible: true,
    specialtiesVisible: true,
    serviceRegionsVisible: true,
    portfolioVisible: true,
    consultationAvailable: true,
  })

  const [savedMessage, setSavedMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getMyContractorProfile().then((profile) => setSettings({
      profileVisible: profile.profilePublic ?? true,
      managerContactVisible: profile.contactPublic ?? true,
      specialtiesVisible: profile.specialtyPublic ?? true,
      serviceRegionsVisible: profile.regionPublic ?? true,
      portfolioVisible: profile.portfolioPublic ?? true,
      consultationAvailable: profile.availableForConsult ?? true,
    })).catch(() => undefined)
  }, [])

  const toggleSetting = (key: keyof VisibilitySettings) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }))

    setSavedMessage('')
  }

  const handleSave = async () => {
    setSaving(true)
    setSavedMessage('')
    try {
      await updateMyContractorDisclosure({
        profilePublic: settings.profileVisible,
        contactPublic: settings.managerContactVisible,
        specialtyPublic: settings.specialtiesVisible,
        regionPublic: settings.serviceRegionsVisible,
        portfolioPublic: settings.portfolioVisible,
        availableForConsult: settings.consultationAvailable,
      })
      setSavedMessage('공개 설정이 저장되었습니다.')
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : '공개 설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="업체 공개 설정" back />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-5">
        <p className="text-xs leading-5 text-[#64748b]">
          고객에게 공개할 업체 정보의 범위를 설정하세요.
        </p>

        <section
          className="mt-5 rounded-xl border border-[#e2e8f0] bg-white px-[15px]"
          aria-label="업체 공개 항목"
        >
          <VisibilitySettingRow
            title="업체 프로필 공개"
            description="업체명과 대표 정보를 공개합니다."
            checked={settings.profileVisible}
            onChange={() => toggleSetting('profileVisible')}
          />

          <VisibilitySettingRow
            title="담당자 연락처 공개"
            description="상담 가능한 담당자 연락처를 공개합니다."
            checked={settings.managerContactVisible}
            onChange={() => toggleSetting('managerContactVisible')}
          />

          <VisibilitySettingRow
            title="전문 분야 공개"
            description="시공 가능한 전문 분야를 공개합니다."
            checked={settings.specialtiesVisible}
            onChange={() => toggleSetting('specialtiesVisible')}
          />

          <VisibilitySettingRow
            title="시공 가능 지역 공개"
            description="업체가 시공할 수 있는 지역을 공개합니다."
            checked={settings.serviceRegionsVisible}
            onChange={() => toggleSetting('serviceRegionsVisible')}
          />

          <VisibilitySettingRow
            title="포트폴리오 공개"
            description="승인된 시공 사례를 고객에게 공개합니다."
            checked={settings.portfolioVisible}
            onChange={() => toggleSetting('portfolioVisible')}
          />

          <VisibilitySettingRow
            title="상담 가능 상태"
            description="신규 상담을 받을 수 있는 상태로 표시합니다."
            checked={settings.consultationAvailable}
            onChange={() => toggleSetting('consultationAvailable')}
            showDivider={false}
          />
        </section>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-5 h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
        >
          {saving ? '저장 중...' : '공개 설정 저장'}
        </button>

        <p
          className="sr-only"
          role="status"
          aria-live="polite"
        >
          {savedMessage}
        </p>
      </main>
    </ContractorMobileShell>
  )
}
