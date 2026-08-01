package com.spaceup.domain.quote.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * ⭐ PDF "견적 작성 / 견적 제안 작성" 화면에 대응합니다. 하나의 QuoteRequest(견적요청)에는 여러 개의
 * ContractorQuote가 시간에 따라 생길 수 있어 다대일로 연결하고(재견적 이력 관리), 견적 항목(철거/바닥/조명 등)은
 * ContractorQuoteItem으로 분리했습니다.
 *
 * ⭐ [DB 명칭 정합화] DB팀 명세의 contractor_quote에 클래스명/테이블/PK/일부 컬럼명을 맞췄습니다
 * (Quote→ContractorQuote). PDF엔 warranty_months/additional_cost_conditions/invited_at 등 견적
 * 생애주기 타임스탬프 필드가 더 있지만, 지금 로직이 채우지 않는 컬럼은 추가하지 않았습니다.
 */
@Entity
@Table(name = "contractor_quote")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ContractorQuote extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "quote_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "request_id", nullable = false)
	private QuoteRequest request;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "contractor_id", nullable = false)
	private Member contractor;

	@Column(name = "title", length = 100)
	private String title; // 견적 제목 (예: "역삼 오피스텔 리모델링 견적")

	@Column(name = "available_start_date")
	private String startDate; // 공사 시작 가능일

	@Column(name = "estimated_days")
	private Integer durationDays; // 예상 공사 기간(일)

	@Column(name = "material_cost")
	private Long materialCost; // 자재비

	@Column(name = "labor_cost")
	private Long laborCost; // 인건비

	@Column(name = "vat")
	private Long vat; // 부가세

	@Column(name = "discount")
	private Long discount; // 할인 금액

	@Column(name = "total_amount")
	private Long totalAmount; // 최종 견적 금액

	@Column(name = "detail_content", length = 500)
	private String detailContent; // 견적 상세 내용 (작업범위/자재종류/추가비용 조건 등)

	// ⭐ [Figma 반영] "보낸 견적" 화면의 "유효 07.31" 표시 + "유효기간 연장" 기능용
	@Column(name = "valid_until")
	private LocalDate validUntil;

	// ⭐ [Figma 반영] "보낸 견적 상세"의 "수정 요청" 메모 - 임대인이 남기고 시공사가 확인 후 수정 견적을 작성
	@Column(name = "revision_request_note", length = 500)
	private String revisionRequestNote;

	// ⭐ [Figma 반영] "v1 - 07.14, v2 - 07.15" 같은 버전 표시용 - 수정될 때마다 1씩 증가
	@Builder.Default
	@Column(name = "revision_count", nullable = false)
	private Integer revisionCount = 1;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private QuoteStatus status;

	@Builder.Default
	@OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	private List<ContractorQuoteItem> items = new ArrayList<>();

	public void addItem(ContractorQuoteItem item) {
		items.add(item);
		item.assignQuote(this);
	}

	// ⭐ [최종 검토 반영] 기존에는 상태와 무관하게 전이가 성공해서, 이미 REJECTED된 견적을
	// 다시 ACCEPTED로 바꾸는 것도 가능했습니다. QuoteRequest 도메인과 동일한 가드 패턴을 적용합니다.
	public void submit() {
		validateStatus(QuoteStatus.DRAFT);
		this.status = QuoteStatus.SUBMITTED;
	}

	public void accept() {
		validateStatus(QuoteStatus.SUBMITTED);
		this.status = QuoteStatus.ACCEPTED;
	}

	public void reject() {
		validateStatus(QuoteStatus.SUBMITTED);
		this.status = QuoteStatus.REJECTED;
	}

	private void validateStatus(QuoteStatus expected) {
		if (this.status != expected) {
			throw new com.spaceup.global.error.InvalidStatusTransitionException(
					String.format("현재 상태(%s)에서는 처리할 수 없습니다. 예상 상태: %s", this.status, expected));
		}
	}

	// ⭐ [Figma 반영] "유효기간 연장" 화면 - 시공사만 호출 가능(ContractorQuoteService에서 소유권 검증)
	public void extendValidUntil(LocalDate newValidUntil) {
		this.validUntil = newValidUntil;
	}

	// ⭐ [Figma 반영] "보낸 견적 상세 - 수정 요청" 화면 - 임대인이 요청한 수정 메모를 남깁니다.
	public void requestRevision(String note) {
		this.revisionRequestNote = note;
	}

	// ⭐ [Figma 반영] 수정 견적을 다시 작성/발송하면 버전을 올리고 요청 메모를 비웁니다.
	public void markRevised() {
		this.revisionCount++;
		this.revisionRequestNote = null;
	}

	// ⭐ 자재비+인건비+부가세-할인 = 최종 견적. 항목/금액이 바뀔 때마다 서비스 레이어에서 호출해 재계산합니다.
	public void recalculateTotal() {
		long material = materialCost != null ? materialCost : 0;
		long labor = laborCost != null ? laborCost : 0;
		long vatAmount = vat != null ? vat : 0;
		long discountAmount = discount != null ? discount : 0;
		this.totalAmount = material + labor + vatAmount - discountAmount;
	}
}
