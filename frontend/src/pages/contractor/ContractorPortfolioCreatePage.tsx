import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'

import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import { uploadImage } from '@/api/fileApi'
import { createPortfolio, setPortfolioVisibility } from '@/api/portfolioApi'

interface PortfolioCreateForm {
  projectName: string
  region: string
  propertySummary: string
  workItems: string
  duration: string
  amount: string
  description: string
  isPublic: boolean
}

const INITIAL_FORM: PortfolioCreateForm = {
  projectName: '',
  region: '',
  propertySummary: '',
  workItems: '',
  duration: '',
  amount: '',
  description: '',
  isPublic: true,
}

export default function ContractorPortfolioCreatePage() {
  const navigate = useNavigate()

  const coverImageInputRef =
    useRef<HTMLInputElement>(null)

  const galleryImageInputRef =
    useRef<HTMLInputElement>(null)

  const [form, setForm] =
    useState<PortfolioCreateForm>(INITIAL_FORM)

  const [coverImageName, setCoverImageName] =
    useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const [galleryImageNames, setGalleryImageNames] =
    useState<string[]>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [toastMessage, setToastMessage] =
    useState('')

  const updateField = (
    field: keyof PortfolioCreateForm,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setErrorMessage('')
    setToastMessage('')
  }

  const handleCoverImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    setCoverImageName(selectedFile.name)
    setCoverFile(selectedFile)
    setErrorMessage('')
    setToastMessage('')

    event.target.value = ''
  }

  const handleGalleryImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(
      event.target.files ?? [],
    ).slice(0, 3)

    if (selectedFiles.length === 0) {
      return
    }

    setGalleryImageNames(
      selectedFiles.map((file) => file.name),
    )
    setGalleryFiles(selectedFiles)

    setErrorMessage('')
    setToastMessage('')

    event.target.value = ''
  }

  const validateForm = () => {
    if (!coverImageName) {
      return '대표 이미지를 등록해주세요.'
    }

    if (galleryImageNames.length === 0) {
      return '시공 사진을 한 장 이상 등록해주세요.'
    }

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

    if (!coverFile || galleryFiles.length === 0) return
    const areaM2 = Number(form.propertySummary.match(/[\d.]+/)?.[0])
    const propertyType = form.propertySummary.split(/[·,]/)[0].trim()
    const durationDays = Number(form.duration.match(/\d+/)?.[0])
    const amount = Number(form.amount.replace(/\D/g, ''))
    if (!propertyType || !Number.isFinite(areaM2) || areaM2 <= 0 || !Number.isInteger(durationDays) || durationDays <= 0 || !Number.isFinite(amount) || amount <= 0) {
      setErrorMessage('주택 유형·면적, 시공 기간, 공사 금액을 형식에 맞게 입력해주세요.')
      return
    }
    setSubmitting(true); setErrorMessage('')
    try {
      const [cover, ...gallery] = await Promise.all([coverFile, ...galleryFiles].map((file) => uploadImage(file)))
      const id = await createPortfolio({ projectName: form.projectName.trim(), region: form.region.trim(), propertyType, areaM2, workItems: form.workItems.trim(), durationDays, amount, mainImageUrl: cover.imageUrl, photoUrls: gallery.map((item) => item.imageUrl).join(','), isPublic: form.isPublic })
      await setPortfolioVisibility(id, form.isPublic)
      navigate('/contractor/portfolio')
    } catch (submitError) {
      setErrorMessage(submitError instanceof Error ? submitError.message : '포트폴리오 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDraftSave = () => {
    setErrorMessage('')
    setToastMessage(
      '포트폴리오가 임시 저장되었습니다.',
    )
  }

  const inputClassName =
    'mt-[5px] h-12 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs text-[#64748b] outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]'

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar
        title="포트폴리오 등록"
        back
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">
          대표 이미지와 시공 사례 사진을 등록해
          포트폴리오를 완성하세요.
        </p>

        <form
          className="mt-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="rounded-xl bg-[#eff6ff] p-[13px]">
            <h2 className="text-[13px] font-bold text-[#1e293b]">
              대표 이미지
            </h2>

            <p className="mt-2 text-[11px] leading-[18px] text-[#64748b]">
              목록에서 대표로 표시할 이미지를
              등록하세요.
            </p>

            <div className="mt-2 flex flex-col items-center">
              <span
                aria-hidden="true"
                className="text-2xl font-bold text-[#2563eb]"
              >
                ＋
              </span>

              {coverImageName ? (
                <p
                  title={coverImageName}
                  className="mt-1 max-w-full truncate text-[11px] font-semibold text-[#2563eb]"
                >
                  {coverImageName}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() =>
                  coverImageInputRef.current?.click()
                }
                className="mt-2 h-[34px] w-[151px] rounded-lg border border-[#2563eb] bg-white text-xs font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
              >
                {coverImageName
                  ? '대표 이미지 변경'
                  : '대표 이미지 등록'}
              </button>

              <input
                ref={coverImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCoverImageChange}
                className="hidden"
              />
            </div>
          </section>

          <section className="mt-3 rounded-xl border border-[#e2e8f0] bg-white p-[13px]">
            <h2 className="text-[13px] font-bold text-[#1e293b]">
              시공 사진
            </h2>

            <p className="mt-2 text-[11px] leading-[18px] text-[#64748b]">
              최대 3장의 시공 사례 사진을 등록하세요.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-[10px]">
              {[0, 1, 2].map((index) => {
                const imageName =
                  galleryImageNames[index]

                return (
                  <button
                    key={index}
                    type="button"
                    title={imageName}
                    onClick={() =>
                      galleryImageInputRef.current?.click()
                    }
                    className={`flex h-[70px] min-w-0 flex-col items-center justify-center rounded-lg border ${
                      imageName
                        ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]'
                        : 'border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]'
                    } focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]`}
                  >
                    {imageName ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="text-lg font-bold"
                        >
                          ✓
                        </span>

                        <span className="mt-1 max-w-[85px] truncate px-1 text-[10px] font-bold">
                          등록 완료
                        </span>
                      </>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="text-[22px] font-bold"
                      >
                        ＋
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <input
              ref={galleryImageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleGalleryImageChange}
              className="hidden"
            />
          </section>

          <div className="mt-4">
            <label
              htmlFor="portfolio-create-project-name"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              프로젝트명
            </label>

            <input
              id="portfolio-create-project-name"
              type="text"
              value={form.projectName}
              placeholder="성수동 빌라 장판 시공"
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
              htmlFor="portfolio-create-region"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              지역
            </label>

            <input
              id="portfolio-create-region"
              type="text"
              value={form.region}
              placeholder="서울 성동구"
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
              htmlFor="portfolio-create-property"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              주택 유형 · 면적
            </label>

            <input
              id="portfolio-create-property"
              type="text"
              value={form.propertySummary}
              placeholder="오피스텔 · 33㎡"
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
              htmlFor="portfolio-create-work-items"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              시공 항목
            </label>

            <input
              id="portfolio-create-work-items"
              type="text"
              value={form.workItems}
              placeholder="바닥"
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
              htmlFor="portfolio-create-duration"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              시공 기간
            </label>

            <input
              id="portfolio-create-duration"
              type="text"
              value={form.duration}
              placeholder="30일"
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
              htmlFor="portfolio-create-amount"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              공사 금액
            </label>

            <input
              id="portfolio-create-amount"
              type="text"
              value={form.amount}
              placeholder="₩32,000,000"
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
              htmlFor="portfolio-create-description"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              프로젝트 설명
            </label>

            <textarea
              id="portfolio-create-description"
              value={form.description}
              placeholder="시공 사례에 대한 설명을 입력해주세요."
              onChange={(event) =>
                updateField(
                  'description',
                  event.target.value,
                )
              }
              className="mt-[5px] min-h-[88px] w-full resize-none rounded-lg border border-[#e2e8f0] bg-white p-3 text-xs leading-5 text-[#64748b] outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]"
            />
          </div>

          <section className="mt-4 flex min-h-16 items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white px-[13px]">
            <div className="min-w-0">
              <h2 className="text-[13px] font-bold text-[#1e293b]">
                포트폴리오 공개
              </h2>

              <p className="mt-1 text-[11px] leading-[18px] text-[#64748b]">
                고객에게 해당 시공 사례를 공개합니다.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={form.isPublic}
              aria-label="포트폴리오 공개 여부"
              onClick={() =>
                updateField(
                  'isPublic',
                  !form.isPublic,
                )
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
                form.isPublic
                  ? 'bg-[#2563eb]'
                  : 'bg-[#cbd5e1]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  form.isPublic
                    ? 'translate-x-[22px]'
                    : 'translate-x-0.5'
                }`}
              />
            </button>
          </section>

          {errorMessage ? (
            <p
              role="alert"
              aria-live="polite"
              className="mt-3 text-xs font-semibold leading-5 text-[#dc2626]"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleDraftSave}
              className="h-12 flex-1 rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
            >
              임시 저장
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 flex-1 rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
            >
              {submitting ? '등록 중...' : '등록 완료'}
            </button>
          </div>
        </form>
      </main>

      {toastMessage ? (
        <button
          type="button"
          role="status"
          aria-live="polite"
          aria-label="임시 저장 안내 닫기"
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
