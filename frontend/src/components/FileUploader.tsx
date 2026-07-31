import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'

interface FileUploaderProps {
  accept?: string
  maxSizeMB?: number
  onFileSelect: (file: File) => void
  label?: string
}

export default function FileUploader({
  accept = 'image/*,.pdf',
  maxSizeMB = 20,
  onFileSelect,
  label = '평면도 파일을 드래그하거나 클릭하여 업로드',
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = (file: File) => {
    setError(null)
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`)
      return
    }
    setFileName(file.name)
    onFileSelect(file)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
        ${isDragging ? 'border-primary-400 bg-primary-500/10' : 'border-slate-700 hover:border-primary-500 hover:bg-white/5'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      aria-label="파일 업로드 영역"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onChange}
        id="file-uploader-input"
      />
      <div className="text-5xl">🏠</div>
      <p className="text-slate-300 font-medium text-center">{label}</p>
      {fileName && (
        <p className="text-primary-400 text-sm font-semibold">✓ {fileName}</p>
      )}
      <p className="text-slate-500 text-xs">JPG, PNG, PDF 지원 · 최대 {maxSizeMB}MB</p>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
