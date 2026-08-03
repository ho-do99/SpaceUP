import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import FloorPlanUploadZone from '@/components/user/FloorPlanUploadZone'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

export default function FloorPlanUploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!file) {
      return
    }

    navigate('/analysis/loading')
  }

  return (
    <UserScreenShell>
      <UserHeader
        variant="detail"
        title="평면도 업로드"
        onBack={() => navigate(-1)}
      />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4">
          <AnalysisStepIndicator currentStep={2} />

          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-6 text-[#1e293b]">
              빌라 평면도를 업로드해주세요
            </h1>
            <p className="mt-1.5 min-h-[38px] break-keep text-[12px] leading-[19px] text-[#64748b]">
              원룸·빌라 등 자동 조회가 어려운 주택은 평면도를 직접 업로드해주세요.
            </p>
          </section>

          <div className="mt-3">
            <FloorPlanUploadZone file={file} onFileChange={setFile} />
          </div>
        </main>

        <footer className="shrink-0 bg-white px-4 pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            disabled={!file}
            className={`h-12 w-full !rounded-[8px] !border !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              file
                ? '!border-[#2563eb] !bg-[#2563eb] hover:!bg-[#2563eb]'
                : '!border-[#cbd5e1] !bg-[#cbd5e1] !opacity-100'
            }`}
          >
            다음
          </Button>
        </footer>
      </form>
    </UserScreenShell>
  )
}
