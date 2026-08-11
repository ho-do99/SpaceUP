import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import { uploadImage } from '@/api/fileApi'
import { getPortfolio, setPortfolioVisibility, updatePortfolio, type PortfolioResponse } from '@/api/portfolioApi'

interface PortfolioFormState {
  projectName: string
  region: string
  propertySummary: string
  workItems: string
  duration: string
  amount: string
  description: string
  visibility: '공개' | '비공개'
}

interface PhotoSlot {
  name: string
  status: '대표' | '완료' | '실패'
}

const PORTFOLIO_DATA: Record<
  string,
  PortfolioFormState
> = {
  'portfolio-1': {
    projectName: '성수동 빌라 바닥재 시공',
    region: '서울 성동구',
    propertySummary: '오피스텔 · 33㎡',
    workItems: '바닥',
    duration: '30일',
    amount: '₩32,000,000',
    description:
      '수납과 조명을 개선해 공간 활용도를 높인 시공 사례입니다.',
    visibility: '공개',
  },
  'portfolio-2': {
    projectName: '광주 아파트 거실 리모델링',
    region: '광주 북구',
    propertySummary: '아파트 · 84㎡',
    workItems: '벽지 · 바닥',
    duration: '21일',
    amount: '₩28,000,000',
    description:
      '거실의 벽지와 바닥재를 교체한 시공 사례입니다.',
    visibility: '공개',
  },
}

const DEFAULT_PHOTO_SLOTS: PhotoSlot[] = [
  {
    name: '대표 이미지',
    status: '대표',
  },
  {
    name: '시공 사진',
    status: '완료',
  },
  {
    name: '업로드 실패',
    status: '실패',
  },
]

const EMPTY_FORM: PortfolioFormState = { projectName: '', region: '', propertySummary: '', workItems: '', duration: '', amount: '', description: '', visibility: '공개' }

export default function ContractorPortfolioEditPage() {
  const navigate = useNavigate()
  const { portfolioId = 'portfolio-1' } = useParams()
  const numericId = Number(portfolioId)
  const isNumeric = Number.isInteger(numericId) && numericId > 0

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] =
    useState<PortfolioFormState>(
      isNumeric ? EMPTY_FORM : (PORTFOLIO_DATA[portfolioId] ?? PORTFOLIO_DATA['portfolio-1']),
    )

  const [photoSlots, setPhotoSlots] =
    useState<PhotoSlot[]>(DEFAULT_PHOTO_SLOTS)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [toastMessage, setToastMessage] =
    useState('')

  useEffect(() => {
    if (!isNumeric) return
    let active = true
    getPortfolio(numericId).then((item) => {
      if (!active) return
      setPortfolio(item)
      setForm({ projectName: item.projectName, region: item.region, propertySummary: `${item.propertyType} · ${item.areaM2}㎡`, workItems: item.workItems, duration: `${item.durationDays}일`, amount: String(item.amount), description: '', visibility: item.isPublic ? '공개' : '비공개' })
      setPhotoSlots(item.photoUrls.split(',').filter(Boolean).map((name) => ({ name, status: '완료' })))
    }).catch((loadError) => setErrorMessage(loadError instanceof Error ? loadError.message : '포트폴리오를 불러오지 못했습니다.'))
    return () => { active = false }
  }, [isNumeric, numericId])

  const updateField = (
    field: keyof PortfolioFormState,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setErrorMessage('')
    setToastMessage('')
  }

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(
      event.target.files ?? [],
    ).slice(0, 3)

    if (selectedFiles.length === 0) {
      return
    }

    setPhotoSlots(
      selectedFiles.map((file, index) => ({
        name: file.name,
        status: index === 0 ? '대표' : '완료',
      })),
    )
    setSelectedFiles(selectedFiles)

    event.target.value = ''
    setToastMessage('')
  }

  const validateForm = () => {
    if (!form.projectName.trim()) {
      return '프로젝트명을 입력해주세요.'
    }

    if (!form.region.trim()) {
      return '지역을 입력해주세요.'
    }

    if (!form.propertySummary.trim()) {
      return '주택 유형과 면적을 입력해주세요.'
    }

    if (!form.workItems.trim()) {
      return '시공 항목을 입력해주세요.'
    }

    if (!form.duration.trim()) {
      return '시공 기간을 입력해주세요.'
    }

    if (!form.amount.trim()) {
      return '공사 금액을 입력해주세요.'
    }

    if (!form.description.trim()) {
      return '프로젝트 설명을 입력해주세요.'
    }

    return ''
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const validationMessage = validateForm()

    if (validationMessage) {
      setErrorMessage(validationMessage)
      setToastMessage('')
      return
    }

    if (!isNumeric || !portfolio) { setErrorMessage('포트폴리오 정보를 확인할 수 없습니다.'); return }
    const areaM2 = Number(form.propertySummary.match(/[\d.]+/)?.[0])
    const propertyType = form.propertySummary.split(/[·,]/)[0].trim()
    const durationDays = Number(form.duration.match(/\d+/)?.[0])
    const amount = Number(form.amount.replace(/\D/g, ''))
    if (!propertyType || !Number.isFinite(areaM2) || areaM2 <= 0 || !Number.isInteger(durationDays) || durationDays <= 0 || !Number.isFinite(amount) || amount <= 0) { setErrorMessage('주택 유형·면적, 시공 기간, 공사 금액을 형식에 맞게 입력해주세요.'); return }
    setSubmitting(true); setErrorMessage('')
    try {
      const uploaded = selectedFiles.length ? await Promise.all(selectedFiles.map((file) => uploadImage(file))) : []
      const photoUrls = uploaded.length ? uploaded.map((item) => item.imageUrl).join(',') : portfolio.photoUrls
      await updatePortfolio(numericId, { projectName: form.projectName.trim(), region: form.region.trim(), propertyType, areaM2, workItems: form.workItems.trim(), durationDays, amount, mainImageUrl: uploaded[0]?.imageUrl || portfolio.mainImageUrl, photoUrls, isPublic: form.visibility === '공개' })
      await setPortfolioVisibility(numericId, form.visibility === '공개')
      setToastMessage('포트폴리오 수정 내용이 저장되었습니다.')
    } catch (submitError) { setErrorMessage(submitError instanceof Error ? submitError.message : '포트폴리오 수정에 실패했습니다.') }
    finally { setSubmitting(false) }
  }

  const handleDraftSave = () => {
    setErrorMessage('')
    setToastMessage(
      '포트폴리오가 임시 저장되었습니다.',
    )
  }

  const inputClassName =
    'mt-[5px] h-11 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs text-[#64748b] outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]'

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar
        title="포트폴리오 수정"
        back
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <p className="text-xs leading-[17px] text-[#64748b]">
          등록된 시공 사례 정보를 수정하세요.
        </p>

        <form
          className="mt-3"
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="rounded-xl border border-[#e2e8f0] bg-white p-[14px]">
            <h2 className="text-sm font-bold leading-5 text-[#1e293b]">
              대표 이미지 · 시공 사진
            </h2>

            <div className="mt-2 flex h-[116px] flex-col items-center justify-center rounded-lg bg-[#eff6ff]">
              <span
                aria-hidden="true"
                className="text-[26px] font-bold leading-8 text-[#1e293b]"
              >
                ＋
              </span>

              <p className="mt-1 text-[11px] text-[#64748b]">
                대표 이미지와 시공 사진 여러 장을
                첨부하세요.
              </p>

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="mt-2 h-11 w-40 rounded-lg border border-[#0b2b59] bg-white text-xs font-bold text-[#0b2b59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
              >
                사진 선택
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="mt-2 flex gap-2 overflow-x-auto">
              {photoSlots.map((photo, index) => {
                const statusClassName =
                  photo.status === '대표'
                    ? 'text-[#2563eb]'
                    : photo.status === '완료'
                      ? 'text-[#16a36a]'
                      : 'text-[#e5484d]'

                return (
                  <div
                    key={`${photo.name}-${index}`}
                    title={photo.name}
                    className={`flex h-[88px] min-w-[100px] flex-1 flex-col items-center justify-center rounded-lg bg-[#eff6ff] px-1 ${statusClassName}`}
                  >
                    <span
                      aria-hidden="true"
                      className="text-xl font-bold"
                    >
                      ▧
                    </span>

                    <span className="mt-1 text-[10px] font-bold">
                      {photo.status}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="mt-2 text-[10px] leading-[15px] text-[#64748b]">
              업로드 전 · 업로드 중 · 완료 · 실패 · 삭제 ·
              대표 이미지 지정
            </p>
          </section>

          <div className="mt-3">
            <label
              htmlFor="portfolio-project-name"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              프로젝트명
            </label>

            <input
              id="portfolio-project-name"
              type="text"
              value={form.projectName}
              onChange={(event) =>
                updateField(
                  'projectName',
                  event.target.value,
                )
              }
              className={inputClassName}
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="portfolio-region"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              지역
            </label>

            <input
              id="portfolio-region"
              type="text"
              value={form.region}
              onChange={(event) =>
                updateField(
                  'region',
                  event.target.value,
                )
              }
              className={inputClassName}
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="portfolio-property-summary"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              주택 유형 · 면적
            </label>

            <input
              id="portfolio-property-summary"
              type="text"
              value={form.propertySummary}
              onChange={(event) =>
                updateField(
                  'propertySummary',
                  event.target.value,
                )
              }
              className={inputClassName}
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="portfolio-work-items"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              시공 항목
            </label>

            <input
              id="portfolio-work-items"
              type="text"
              value={form.workItems}
              onChange={(event) =>
                updateField(
                  'workItems',
                  event.target.value,
                )
              }
              className={inputClassName}
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="portfolio-duration"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              시공 기간
            </label>

            <input
              id="portfolio-duration"
              type="text"
              value={form.duration}
              onChange={(event) =>
                updateField(
                  'duration',
                  event.target.value,
                )
              }
              className={inputClassName}
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="portfolio-amount"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              공사 금액
            </label>

            <input
              id="portfolio-amount"
              type="text"
              value={form.amount}
              onChange={(event) =>
                updateField(
                  'amount',
                  event.target.value,
                )
              }
              className={inputClassName}
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="portfolio-description"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              프로젝트 설명
            </label>

            <input
              id="portfolio-description"
              type="text"
              value={form.description}
              onChange={(event) =>
                updateField(
                  'description',
                  event.target.value,
                )
              }
              className={inputClassName}
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="portfolio-visibility"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              공개 여부
            </label>

            <select
              id="portfolio-visibility"
              value={form.visibility}
              onChange={(event) =>
                updateField(
                  'visibility',
                  event.target.value,
                )
              }
              className={inputClassName}
            >
              <option value="공개">공개</option>
              <option value="비공개">비공개</option>
            </select>
          </div>

          {errorMessage ? (
            <p
              role="alert"
              className="mt-3 text-xs font-semibold text-[#dc2626]"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 h-12 w-full rounded-lg bg-[#f05a16] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c2410c]"
          >
            {submitting ? '저장 중...' : '수정 내용 저장'}
          </button>

          <button
            type="button"
            onClick={handleDraftSave}
            className="mt-3 h-12 w-full rounded-lg border border-[#e2e8f0] bg-white text-sm font-bold text-[#0b2b59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            임시 저장
          </button>

          <button
            type="button"
            onClick={() =>
              navigate('/contractor/portfolio')
            }
            className="mt-3 h-12 w-full rounded-lg border border-[#e2e8f0] bg-white text-sm font-bold text-[#0b2b59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            취소
          </button>
        </form>
      </main>

      {toastMessage ? (
        <button
          type="button"
          role="status"
          aria-live="polite"
          aria-label="포트폴리오 저장 안내 닫기"
          onClick={() => setToastMessage('')}
          className="absolute bottom-5 left-1/2 z-40 flex h-11 w-[280px] -translate-x-1/2 items-center justify-center rounded-[10px] bg-[#0f172a] px-3 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <span className="text-center text-xs font-bold text-white">
            {toastMessage}
          </span>
        </button>
      ) : null}
    </ContractorMobileShell>
  )
}
