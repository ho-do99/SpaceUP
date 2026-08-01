package com.spaceup.domain.request.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * ⭐ PDF "임대 정보 입력 ~ 의뢰 상세" 화면들의 핵심 엔티티입니다. 임대인이 견적을 요청하는 워크플로우(상태/배정/거절사유/
 * 자동취소 타이머)를 담당하고, 매물 자체의 속성은 {@link Property}로 분리되어 있습니다(1:1). AI 분석 결과
 * (AnalysisJob)를 함께 들고 있고, 시공사가 이 QuoteRequest를 확인해서 ContractorQuote(견적)를 붙이는 구조입니다.
 *
 * ⭐ [DB 명칭 정합화] DB팀 명세의 quote_request에 클래스명/테이블/PK/일부 컬럼명을 맞췄습니다
 * (Request→QuoteRequest, landlord→owner, budget→budgetAmount). targetRent/budgetMin/budgetMax/
 * desiredDate/requestedItems/requestCode 등은 PDF에 없는 그룹 B 전용 컬럼이라 그대로 유지합니다.
 */
@Entity
@Table(name = "quote_request")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class QuoteRequest extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "request_id")
	private Long id;

	// ⭐ 화면에 보이는 "REQ-260715-012" 같은 사람이 읽는 코드. DB 내부 PK(id)와 분리해서 운영합니다.
	// IDENTITY 전략은 save() 호출 즉시 INSERT가 실행되는데, 이 시점엔 requestCode가 아직 null(코드는 id 발급 후에
	// assignCode()로 채움)이라 nullable=false로 두면 그 첫 INSERT 자체가 제약조건 위반으로 실패합니다.
	@Column(name = "request_code", unique = true, length = 30)
	private String requestCode;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "owner_id", nullable = false)
	private Member owner; // 의뢰를 등록한 임대인

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "property_id", nullable = false)
	private Property property; // 이 견적요청이 대상으로 하는 매물

	// ⭐ 특정 시공사를 지정해서 견적을 요청한 경우(PDF 08 견적 요청 화면). 아직 매칭 전이면 null일 수 있습니다.
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "contractor_id")
	private Member contractor;

	@Column(name = "target_rent")
	private Long targetRent; // 목표 월세(원)

	// ⭐ [Figma 반영] "의뢰 목록" 화면엔 예산이 "300~500만원" 같은 범위로 표시됩니다. 기존 단일 budget 필드는
	// 하위호환을 위해 남겨두고, 범위 표현이 필요한 화면은 아래 budgetMin/budgetMax를 사용하세요.
	@Column(name = "budget_amount")
	private Long budget; // (레거시) 리모델링 예산 단일값 - budgetMin/budgetMax 사용을 권장합니다.

	@Column(name = "budget_min")
	private Long budgetMin; // 집주인 예산 범위 하한(원)

	@Column(name = "budget_max")
	private Long budgetMax; // 집주인 예산 범위 상한(원)

	@Column(name = "desired_date")
	private String desiredDate; // 희망 시공/입주 일정 (yyyy-MM-dd)

	@Column(name = "requested_items", length = 200)
	private String requestedItems; // 요청 항목 (예: "도배,장판,조명" - 콤마 구분)

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private RequestStatus status;

	// ⭐ [Figma 반영] "거절 사유" 화면 - 시공사가 거절할 때 사유를 선택/입력합니다.
	@Enumerated(EnumType.STRING)
	@Column(name = "reject_reason", length = 30)
	private RejectReason rejectReason;

	@Column(name = "reject_reason_detail", length = 300)
	private String rejectReasonDetail; // rejectReason=OTHER일 때 직접 입력한 사유

	// ⭐ [Figma 반영] "7일 자동 취소 정책" - 마지막 유효 활동 시각. 채팅/일정등록/방문완료/견적작성 등 활동이 있을 때마다
	// touch()로 갱신하고, 배치(RequestAutoCancelScheduler)가 이 값을 기준으로 168시간 경과 시 자동 취소합니다.
	@Column(name = "last_activity_at")
	private LocalDateTime lastActivityAt;

	// ⭐ 144시간(D-1) 알림을 중복 발송하지 않기 위한 플래그
	@Builder.Default
	@Column(name = "warning_sent", nullable = false)
	private boolean warningSent = false;

	// ===== 상태 전이 메서드 (도메인 로직은 서비스가 아니라 엔티티가 책임지도록) =====

	public void assignContractor(Member contractor) {
		this.contractor = contractor;
		this.status = RequestStatus.REVIEWING;
	}

	public void approve() {
		this.status = RequestStatus.QUOTE_REQUESTED;
	}

	// ⭐ [Figma 반영] 거절 사유를 함께 기록하도록 변경했습니다.
	public void reject(RejectReason reason, String detail) {
		this.status = RequestStatus.REJECTED;
		this.rejectReason = reason;
		this.rejectReasonDetail = detail;
	}

	public void startProgress() {
		this.status = RequestStatus.IN_PROGRESS;
	}

	public void complete() {
		this.status = RequestStatus.COMPLETED;
	}

	// ⭐ [Figma 반영] "168시간 미활동 자동 취소" - 자동취소 배치 또는 임대인의 수동 취소에서 호출
	public void cancel() {
		this.status = RequestStatus.CANCELED;
	}

	// ⭐ [Figma 반영] 채팅 전송/일정 등록/일정 변경/일정 수락/일정 확인/현장 방문 완료/견적 임시저장/견적 전송 등
	// "유효 활동"이 발생할 때마다 호출해 자동취소 타이머를 리셋합니다.
	public void touch() {
		this.lastActivityAt = LocalDateTime.now();
		this.warningSent = false;
	}

	public void markWarningSent() {
		this.warningSent = true;
	}

	// ⭐ DB가 부여한 auto-increment id를 이용해 사람이 읽는 코드를 나중에 붙일 때 사용 (RequestService 참고 -
	// count()+1 방식 대신 실제 PK 기반이라 동시 요청에도 코드가 절대 겹치지 않습니다)
	public void assignCode(String requestCode) {
		this.requestCode = requestCode;
	}
}
