import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const LANDING_DURATION_MS = 1500

export default function LandingPage({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete()
      navigate('/login', { replace: true })
    }, LANDING_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [navigate, onComplete])

  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-white">
      <h1 className="text-[32px] font-bold leading-[42px] tracking-[-0.32px] text-[#2563eb]">
        SpaceUP
      </h1>
    </main>
  )
}
