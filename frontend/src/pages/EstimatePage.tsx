import {
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

interface AgreementState {
  amountChecked: boolean
  scheduleChecked: boolean
  additionalCostChecked: boolean
}

interface EstimateSectionProps {
  title: string
  children: ReactNode
  className?: string
}

interface ApprovedEstimateState {
  status: 'APPROVED'
  requestId: string
  estimateId: string
  approvedAt: string
  contractorId: string
  contractorName: string
  contractorMeta: string
  estimateNumber: string
  totalAmount: string
  startDate: string
  endDate: string
  durationDays: number
}

function EstimateSection({
  title,
  children,
  className = '',
}: EstimateSectionProps) {
  return (
    <section
      className={`rounded-[12px] border border-[#e2e8f0] bg-white p-4 ${className}`}
    >
      <h2 className="text-[15px] font-bold leading-[23px] text-[#0f172a]">
        {title}
      </h2>

      <div className="mt-2 text-[12px] leading-[18px] text-[#64748b]">
        {children}
      </div>
    </section>
  )
}

function InformationRow({
  label,
  value,
  strong = false,
  blue = false,
}: {
  label: string
  value: string
  strong?: boolean
  blue?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[#64748b]">
        {label}
      </span>

      <span
        className={`text-right ${
          strong ? 'font-bold' : 'font-normal'
        } ${
          blue
            ? 'text-[#2563eb]'
            : 'text-[#334155]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function SuccessIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="#16A34A"
        strokeWidth="1.8"
      />

      <path
        d="M8 12L10.7 14.7L16 9.5"
        stroke="#16A34A"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function EstimatePage() {
  const navigate = useNavigate()

  const { id } = useParams<{
    id: string
  }>()

  const estimateId = id ?? '1'

  /*
   * 현재 UI 예시 데이터에서 /estimate/1 은
   * 공간디자인 인테리어 요청(request-space-design)에 해당합니다.
   *
   * 실제 API 연동 시에는 견적 응답에 포함되는 requestId를
   * 사용하도록 교체하면 됩니다.
   */
  const requestId = 'request-space-design'

  const [agreements, setAgreements] =
    useState<AgreementState>({
      amountChecked: false,
      scheduleChecked: false,
      additionalCostChecked: false,
    })

  const [actionMessage, setActionMessage] =
    useState('')

  const [rejectModalOpen, setRejectModalOpen] =
    useState(false)

  const [processing, setProcessing] =
    useState(false)

  const canApprove = useMemo(
    () =>
      agreements.amountChecked &&
      agreements.scheduleChecked &&
      agreements.additionalCostChecked &&
      !processing,
    [
      agreements,
      processing,
    ],
  )

  const updateAgreement = (
    key: keyof AgreementState,
    checked: boolean,
  ) => {
    setAgreements((current) => ({
      ...current,
      [key]: checked,
    }))
  }

  const approveEstimate = () => {
    if (!canApprove) return

    setProcessing(true)

    const approvedEstimate: ApprovedEstimateState = {
      status: 'APPROVED',
      requestId,
      estimateId,
      approvedAt: new Date().toISOString(),
      contractorId: '1',
      contractorName: '공간디자인 인테리어',
      contractorMeta: '광주 북구 · 리모델링 전문',
      estimateNumber: 'SP-20260724-001',
      totalAmount: '5,500,000원',
      startDate: '2026.08.05',
      endDate: '2026.08.07',
      durationDays: 3,
    }

    /*
     * 견적 ID 기준 저장
     */
    sessionStorage.setItem(
      `spaceup-estimate-${estimateId}`,
      JSON.stringify(approvedEstimate),
    )

    /*
     * 요청 ID 기준 저장
     * 마이페이지 → 견적 요청 내역 → 상세보기에서 사용
     */
    sessionStorage.setItem(
      `spaceup-request-estimate-${requestId}`,
      JSON.stringify(approvedEstimate),
    )

    setActionMessage(
      '견적 승인이 완료되었습니다.',
    )

    window.setTimeout(() => {
      navigate(
        `/mypage/requests/${requestId}/schedule/1`,
      )
    }, 1200)
  }

  const rejectEstimate = () => {
    if (processing) return

    setProcessing(true)
    setRejectModalOpen(false)

    const rejectedEstimate = {
      status: 'REJECTED',
      requestId,
      estimateId,
      rejectedAt: new Date().toISOString(),
    }

    sessionStorage.setItem(
      `spaceup-estimate-${estimateId}`,
      JSON.stringify(rejectedEstimate),
    )

    sessionStorage.setItem(
      `spaceup-request-estimate-${requestId}`,
      JSON.stringify(rejectedEstimate),
    )

    setActionMessage(
      '견적을 거절했습니다.',
    )

    window.setTimeout(() => {
      navigate('/mypage/requests')
    }, 1200)
  }

  return (
    <UserScreenShell className="h-dvh bg-[#f8fafc]">
      <UserHeader
        variant="detail"
        title="받은 견적서"
        onBack={() =>
          navigate('/mypage/requests')
        }
      />

      {actionMessage ? (
        <div className="pointer-events-none absolute left-4 right-4 top-[70px] z-50">
          <div className="mx-auto flex max-w-[361px] items-center gap-3 rounded-[12px] border border-[#bbf7d0] bg-white px-4 py-3 shadow-lg">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dcfce7]">
              <SuccessIcon />
            </span>

            <p className="text-[12px] font-bold text-[#1e293b]">
              {actionMessage}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#f8fafc] px-4 pb-[120px] pt-5">
          <div className="space-y-4">
            <section className="rounded-[12px] bg-[#eff6ff] px-4 py-[14px]">
              <h1 className="text-[13px] font-bold leading-5 text-[#2563eb]">
                견적 도착
              </h1>

              <p className="mt-2 text-[11px] leading-[17px] text-[#64748b]">
                시공사 견적서가 도착했습니다.
                금액과 조건을 확인해 주세요.
              </p>
            </section>

            <EstimateSection title="받은 견적서">
              <div className="space-y-1">
                <p>
                  견적번호&nbsp;&nbsp;
                  <span className="text-[#334155]">
                    SP-20260724-001
                  </span>
                </p>

                <p>
                  작성일&nbsp;&nbsp;
                  <span className="text-[#334155]">
                    2026.07.24
                  </span>
                </p>

                <p>
                  견적 유효기간&nbsp;&nbsp;
                  <span className="text-[#334155]">
                    2026.08.07까지
                  </span>
                </p>

                <p>
                  현장방문 완료일&nbsp;&nbsp;
                  <span className="text-[#334155]">
                    2026.07.24
                  </span>
                </p>
              </div>

              <div className="mt-4 rounded-[8px] bg-[#f8fafc] px-3 py-2">
                <p className="text-[11px] text-[#475569]">
                  📅 견적 유효기간이 7일 남았습니다.
                </p>
              </div>
            </EstimateSection>

            <EstimateSection title="견적을 보낸 시공사">
              <div className="space-y-1">
                <p className="font-medium text-[#334155]">
                  공간디자인 인테리어
                </p>

                <p>
                  담당자 김현수 · 010-1234-5678
                </p>

                <p>
                  사업자등록번호 123-45-67890
                </p>

                <p>
                  평점 4.8 · 바닥재·벽지
                </p>

                <p>
                  A/S 시공 완료 후 1년
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate('/chats')
                }
                className="mt-4 h-12 w-full rounded-[10px] border border-[#2563eb] bg-white text-[14px] font-bold text-[#2563eb]"
              >
                시공사에 문의하기
              </button>
            </EstimateSection>

            <EstimateSection title="현장 정보">
              <div className="space-y-1">
                <p>고객명 김지선</p>

                <p>
                  광주광역시 서구 ○○아파트
                  101동 1203호
                </p>

                <p>
                  아파트 · 전용 84㎡ · 층고 2.4m
                </p>

                <p>
                  바닥 59㎡ · 벽지 168㎡
                </p>

                <p>
                  시공 항목 바닥재, 벽지
                </p>
              </div>

              <p className="mt-4 text-[11px] leading-[17px] text-[#64748b]">
                실제 내용과 다르면 시공사에 수정을
                요청해 주세요.
              </p>
            </EstimateSection>

            <EstimateSection title="바닥재 견적">
              <div className="space-y-1">
                <p className="font-medium text-[#334155]">
                  KCC · 숲 소리순 · 내추럴 오크
                </p>

                <p>59㎡ · 32,000원/㎡</p>
              </div>

              <div className="my-4 border-t border-[#e2e8f0]" />

              <div className="space-y-2">
                <InformationRow
                  label="자재비"
                  value="1,888,000원"
                />
                <InformationRow
                  label="시공비"
                  value="1,200,000원"
                />
                <InformationRow
                  label="철거비"
                  value="300,000원"
                />
                <InformationRow
                  label="폐기물 처리비"
                  value="100,000원"
                />
                <InformationRow
                  label="접착제·부자재비"
                  value="162,000원"
                />
                <InformationRow
                  label="기타 비용"
                  value="50,000원"
                />
              </div>

              <div className="my-4 border-t border-[#e2e8f0]" />

              <InformationRow
                label="항목 합계"
                value="3,700,000원"
                strong
                blue
              />

              <p className="mt-4 text-[11px] leading-[17px] text-[#64748b]">
                철거 후 바닥 상태에 따라 보수 비용이
                추가될 수 있습니다.
              </p>
            </EstimateSection>

            <EstimateSection title="벽지 견적">
              <div className="space-y-1">
                <p className="font-medium text-[#334155]">
                  LX하우시스 · 베스띠 · 실크벽지 · 웜 화이트
                </p>

                <p>168㎡ · 9,500원/㎡</p>
              </div>

              <div className="my-4 border-t border-[#e2e8f0]" />

              <div className="space-y-2">
                <InformationRow
                  label="자재비"
                  value="800,000원"
                />
                <InformationRow
                  label="시공비"
                  value="600,000원"
                />
                <InformationRow
                  label="철거비"
                  value="150,000원"
                />
                <InformationRow
                  label="폐기물 처리비"
                  value="100,000원"
                />
                <InformationRow
                  label="풀·접착제·부자재비"
                  value="100,000원"
                />
                <InformationRow
                  label="기타 비용"
                  value="50,000원"
                />
              </div>

              <div className="my-4 border-t border-[#e2e8f0]" />

              <InformationRow
                label="항목 합계"
                value="1,700,000원"
                strong
                blue
              />
            </EstimateSection>

            <EstimateSection title="추가 비용">
              <div className="space-y-2">
                <InformationRow
                  label="엘리베이터 사용료"
                  value="100,000원"
                />

                <InformationRow
                  label="주차비"
                  value="50,000원"
                />
              </div>

              <div className="my-4 border-t border-[#e2e8f0]" />

              <InformationRow
                label="추가 비용 합계"
                value="150,000원"
                strong
                blue
              />

              <p className="mt-4 text-[11px] text-[#64748b]">
                ⓘ 세부 내용은 시공사에 문의할 수 있습니다.
              </p>
            </EstimateSection>

            <EstimateSection title="최종 견적 금액">
              <div className="space-y-2">
                <InformationRow
                  label="바닥재"
                  value="3,700,000원"
                />
                <InformationRow
                  label="벽지"
                  value="1,700,000원"
                />
                <InformationRow
                  label="추가 비용"
                  value="150,000원"
                />
                <InformationRow
                  label="할인"
                  value="-50,000원"
                />
                <InformationRow
                  label="공급가액"
                  value="5,000,000원"
                />
                <InformationRow
                  label="부가세"
                  value="500,000원"
                />
              </div>

              <div className="my-4 border-t border-[#e2e8f0]" />

              <div className="flex items-end justify-between gap-3">
                <span className="text-[13px] font-bold text-[#0f172a]">
                  최종 견적 금액
                </span>

                <strong className="text-[20px] font-bold leading-7 text-[#2563eb]">
                  5,500,000원
                </strong>
              </div>
            </EstimateSection>

            <EstimateSection title="시공 조건">
              <div className="space-y-2">
                <InformationRow
                  label="시작 예정일"
                  value="2026.08.05"
                />
                <InformationRow
                  label="예상 기간"
                  value="3일"
                />
                <InformationRow
                  label="견적 유효기간"
                  value="작성일로부터 14일"
                />
                <InformationRow
                  label="결제 조건"
                  value="계약금 20% · 중도금 40% · 잔금 40%"
                />
                <InformationRow
                  label="A/S 보증"
                  value="시공 완료 후 1년"
                />
              </div>
            </EstimateSection>

            <EstimateSection title="시공사 전달사항">
              <p className="leading-[19px]">
                기존 바닥 철거 후 바닥 상태에 따라
                일부 보수 비용이 추가될 수 있습니다.
                정확한 시공 일정은 계약 확정 후 안내드립니다.
              </p>
            </EstimateSection>

            <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
              <h2 className="text-[15px] font-bold leading-[23px] text-[#0f172a]">
                견적 승인 전 확인
              </h2>

              <p className="mt-2 text-[11px] leading-[17px] text-[#64748b]">
                아래 내용을 모두 확인한 후 견적을 승인해주세요.
              </p>

              <div className="mt-3 space-y-1">
                <label className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.amountChecked}
                    onChange={(event) =>
                      updateAgreement(
                        'amountChecked',
                        event.target.checked,
                      )
                    }
                    className="size-5 accent-[#2563eb]"
                  />

                  <span className="text-[12px] leading-[18px] text-[#0f172a]">
                    견적 금액과 세부 항목을 확인했습니다.
                  </span>
                </label>

                <label className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.scheduleChecked}
                    onChange={(event) =>
                      updateAgreement(
                        'scheduleChecked',
                        event.target.checked,
                      )
                    }
                    className="size-5 accent-[#2563eb]"
                  />

                  <span className="text-[12px] leading-[18px] text-[#0f172a]">
                    시공 일정과 결제 조건을 확인했습니다.
                  </span>
                </label>

                <label className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.additionalCostChecked}
                    onChange={(event) =>
                      updateAgreement(
                        'additionalCostChecked',
                        event.target.checked,
                      )
                    }
                    className="size-5 accent-[#2563eb]"
                  />

                  <span className="text-[12px] leading-[18px] text-[#0f172a]">
                    추가 비용 발생 가능성을 확인했습니다.
                  </span>
                </label>
              </div>
            </section>
          </div>
        </main>

        <footer className="shrink-0 border-t border-[#e2e8f0] bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-[15px]">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={processing}
              onClick={() =>
                setRejectModalOpen(true)
              }
              className="h-12 rounded-[10px] border border-[#dc2626] bg-white text-[13px] font-bold text-[#dc2626] disabled:border-[#cbd5e1] disabled:text-[#94a3b8]"
            >
              견적 거절
            </button>

            <button
              type="button"
              disabled={!canApprove}
              onClick={approveEstimate}
              className="h-12 rounded-[10px] border border-[#2563eb] bg-[#2563eb] text-[13px] font-bold text-white disabled:border-[#93b4f5] disabled:bg-[#93b4f5]"
            >
              {processing
                ? '처리 중...'
                : '견적 승인'}
            </button>
          </div>
        </footer>
      </div>

      {rejectModalOpen ? (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/40 px-6">
          <div className="w-full max-w-[345px] rounded-[16px] bg-white p-5 shadow-xl">
            <h2 className="text-[17px] font-bold text-[#0f172a]">
              견적을 거절하시겠어요?
            </h2>

            <p className="mt-2 break-keep text-[12px] leading-5 text-[#64748b]">
              거절 후에는 해당 견적을 승인할 수 없습니다.
              견적 내용을 다시 한번 확인해주세요.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setRejectModalOpen(false)
                }
                className="h-11 rounded-[8px] border border-[#cbd5e1] bg-white text-[12px] font-bold text-[#475569]"
              >
                취소
              </button>

              <button
                type="button"
                onClick={rejectEstimate}
                className="h-11 rounded-[8px] bg-[#dc2626] text-[12px] font-bold text-white"
              >
                견적 거절
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </UserScreenShell>
  )
}