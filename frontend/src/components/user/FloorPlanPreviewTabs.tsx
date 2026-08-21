import { lazy, Suspense, useEffect, useState } from 'react'

import { getFloorplanVisualization } from '@/api/analysisApi'
import type { AnalysisSpaceResponse, FloorplanVisualization } from '@/types/analysis'

const FloorPlan3DViewer = lazy(() => import('@/components/user/FloorPlanInteractive3DViewer'))

interface Props {
  requestId: number | null
  floorPlanPreviewUrl: string | null
  spaces: AnalysisSpaceResponse[]
  onToggleSpace: (spaceId: number) => void
}

export default function FloorPlanPreviewTabs({ requestId, floorPlanPreviewUrl, spaces, onToggleSpace }: Props) {
  const [tab, setTab] = useState<'original' | '3d'>('3d')
  const [data, setData] = useState<FloorplanVisualization | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let active = true
    if (!requestId) {
      setData(null)
      setLoading(false)
      setError('진행 중인 분석 정보를 찾을 수 없습니다.')
      return undefined
    }
    setData(null)
    setLoading(true)
    setError('')

    void getFloorplanVisualization(requestId)
      .then((visualization) => {
        if (active) setData(visualization)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : '3D 분석 결과를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadAttempt, requestId])

  const retry3d = () => {
    setData(null)
    setLoadAttempt((current) => current + 1)
  }

  return (
    <section aria-label="평면도 분석 결과" className="w-full overflow-hidden rounded-[7px] border border-[#cbd5e1] bg-white">
      <div role="tablist" aria-label="평면도 보기 방식" className="grid grid-cols-2 border-b border-[#cbd5e1]">
        <button type="button" role="tab" aria-selected={tab === 'original'} className={`h-8 text-[10px] font-bold ${tab === 'original' ? 'bg-[#2563eb] text-white' : 'bg-white text-[#475569]'}`} onClick={() => setTab('original')}>원본</button>
        <button type="button" role="tab" aria-selected={tab === '3d'} className={`h-8 text-[10px] font-bold ${tab === '3d' ? 'bg-[#2563eb] text-white' : 'bg-white text-[#475569]'}`} onClick={() => setTab('3d')}>3D 분석</button>
      </div>
      <div role="tabpanel" className="h-[322px] overflow-auto bg-[#fafafa]">
        {tab === 'original' ? (floorPlanPreviewUrl ? (
          <img src={floorPlanPreviewUrl} alt="분석한 평면도" className="h-full w-full object-contain" />
        ) : (
          <div role="img" aria-label="분석 평면도 미리보기를 표시할 수 없습니다." className="flex h-full items-center justify-center px-4 text-center text-[11px] text-[#64748b]">평면도 미리보기 없음</div>
        )) : loading ? (
          <p role="status" className="flex h-full items-center justify-center text-[11px] text-[#475569]">3D 분석 결과를 불러오는 중...</p>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-3 text-center"><p role="alert" className="text-[11px] text-[#dc2626]">{error}</p><button type="button" className="rounded border border-[#2563eb] px-3 py-1 text-[10px] text-[#2563eb]" onClick={retry3d}>다시 시도</button></div>
        ) : data ? (
          <Suspense fallback={<p role="status" className="flex h-full items-center justify-center text-[11px] text-[#475569]">3D 화면을 준비하는 중...</p>}>
            <FloorPlan3DViewer visualization={data} spaces={spaces} onToggleSpace={onToggleSpace} />
          </Suspense>
        ) : null}
      </div>
    </section>
  )
}
