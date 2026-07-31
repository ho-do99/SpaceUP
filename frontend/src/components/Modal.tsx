import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative card p-6 w-full max-w-lg z-10 animate-[fadeInUp_0.2s_ease]">
        {title && (
          <h2 className="text-xl font-bold text-slate-100 mb-4">{title}</h2>
        )}
        <button
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          onClick={onClose}
          aria-label="닫기"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}
