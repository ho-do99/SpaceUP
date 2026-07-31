import { useState } from 'react'
import Button from '@/components/Button'
import FileUploader from '@/components/FileUploader'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function FloorPlanUploadPage() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 px-4">
        <section className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">평면도 분석</h1>
          <p className="text-slate-400 mb-8">
            JPG, PNG 또는 PDF 평면도를 업로드하면 공간 분석을 시작합니다.
          </p>
          <FileUploader onFileSelect={setFile} />
          <Button className="mt-6 w-full" disabled={!file}>
            {file ? `${file.name} 분석하기` : '파일을 선택해 주세요'}
          </Button>
        </section>
      </main>
      <Footer />
    </>
  )
}
