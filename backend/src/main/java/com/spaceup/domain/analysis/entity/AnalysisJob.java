package com.spaceup.domain.analysis.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * ⭐ PDF "공간 정보 확인" / "의뢰 상세 - AI분석" 화면. 기존엔 Request에 @Embedded로 붙어있었지만, 분석은
 * (1) 외부 ML 파이프라인이 비동기로 채워주고 (2) 재분석 요청이 생길 수 있고 (3) 상태(PENDING/FAILED) 관리가
 * 필요해서 독립 엔티티로 분리했습니다. QuoteRequest : AnalysisJob = 1 : 1 이지만, FK는 이쪽(AnalysisJob)이
 * 들고 있어서 "아직 분석 전"인 QuoteRequest도 자유롭게 만들 수 있습니다.
 *
 * ⭐ [DB 명칭 정합화] DB팀 명세의 analysis_job에 테이블/PK명을 맞췄습니다(클래스명도 SpaceAnalysis→AnalysisJob).
 * PDF의 analysis_job은 floorplan_id/pipeline_version/ocr_result_json 등 OCR·세그멘테이션 파이프라인
 * 필드를 갖고 있지만, 지금 ML 콜백(AnalysisJobResultRequest)이 그런 값을 보내주지 않아서 채울 수 없는
 * 컬럼은 추가하지 않았습니다. 대신 이 앱의 핵심 가치인 roomCount~expectedRentIncrease 등 집계 필드는
 * PDF에 없지만 그대로 유지합니다. PDF의 space_result(공간별 세부 결과, 1:N)도 같은 이유로 만들지 않았습니다.
 */
@Entity
@Table(name = "analysis_job")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AnalysisJob extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "analysis_id")
	private Long id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "request_id", nullable = false, unique = true)
	private QuoteRequest request;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private AnalysisStatus status;

	@Column(name = "room_count")
	private Integer roomCount; // 방 개수

	@Column(name = "bathroom_count")
	private Integer bathroomCount; // 욕실 개수

	@Column(name = "has_balcony")
	private Boolean hasBalcony; // 발코니 유무

	@Column(name = "kitchen_type", length = 20)
	private String kitchenType; // 주방 형태 (일체형/분리형)

	@Column(name = "space_score")
	private Integer spaceScore; // 공간 효율 점수 (0~100)

	@Column(name = "condition_score")
	private Integer conditionScore; // 컨디션/노후도 점수 (0~100)

	@Column(name = "issue_tags", length = 500)
	private String issueTags; // AI 분석 태그 (콤마 구분, 예: "조명 어두움,바닥 노후화")

	@Column(name = "matching_score")
	private Integer matchingScore; // 시공사 매칭 점수 (0~100) - domain/matching 계산 결과 저장

	// ⭐ [Figma 반영] "의뢰 상세 - AI분석" 탭의 "사용자가 받은 예상 견적" 범위 (예: 450만~550만원)
	@Column(name = "estimated_quote_min")
	private Long estimatedQuoteMin;

	@Column(name = "estimated_quote_max")
	private Long estimatedQuoteMax;

	// ⭐ [Figma 반영] "ROI 요약" 카드. 현재 월세는 Property.currentMonthlyRent를 그대로 참조해서 쓰고(중복 저장 안 함),
	// 여기서는 AI가 계산한 예상 상승분/회수기간만 보관합니다.
	// ⭐ [고도화] 이 두 필드는 "확정값"입니다 - completeWith()(ML 콜백)이 먼저 채울 수도 있지만, 시공사 견적이
	// 수락되면 RentalValueCalculator가 실제 확정 견적금액으로 다시 계산해 더 정확한 값으로 덮어씁니다
	// (ContractorQuoteService.accept() 참고).
	@Column(name = "expected_rent_increase_min")
	private Long expectedRentIncreaseMin;

	@Column(name = "expected_rent_increase_max")
	private Long expectedRentIncreaseMax;

	@Column(name = "payback_period_months_min")
	private Integer paybackPeriodMonthsMin;

	@Column(name = "payback_period_months_max")
	private Integer paybackPeriodMonthsMax;

	// ⭐ [고도화] 확정 전세가치 상승분(원). RentalValueCalculator가 시공사 견적 수락 시점에 채웁니다.
	@Column(name = "deposit_increase_min")
	private Long depositIncreaseMin;

	@Column(name = "deposit_increase_max")
	private Long depositIncreaseMax;

	// ⭐ [고도화] 예비값 - 시공사 매칭/견적 전, 임대인이 입력한 희망예산(QuoteRequest.budgetMax)을 인테리어비용으로
	// 임시 사용해 미리 계산한 값입니다(임대인 화면용). 시공사 견적이 수락되면 위 확정 필드가 실제 금액으로 채워집니다.
	@Column(name = "preliminary_deposit_increase_min")
	private Long preliminaryDepositIncreaseMin;

	@Column(name = "preliminary_deposit_increase_max")
	private Long preliminaryDepositIncreaseMax;

	@Column(name = "preliminary_rent_increase_min")
	private Long preliminaryRentIncreaseMin;

	@Column(name = "preliminary_rent_increase_max")
	private Long preliminaryRentIncreaseMax;

	// ⭐ [프론트 연동] "공간 정보 확인" 화면 - 층고는 공간별이 아니라 매물 전체 기준 단일 값으로 요청받았습니다.
	@Column(name = "ceiling_height_m")
	private Double ceilingHeightM;

	// ⭐ [프론트 연동] 공간별(AnalysisSpace) 목록 중 "시공 선택"된 공간들의 바닥/벽지 면적 합계입니다.
	// AnalysisJobService.replaceSpaces()가 공간 목록을 저장할 때마다 다시 계산해서 채웁니다.
	@Column(name = "total_floor_area_m2")
	private Double totalFloorAreaM2;

	@Column(name = "total_wallpaper_area_m2")
	private Double totalWallpaperAreaM2;

	// ⭐ ML 파이프라인 콜백이 이 메서드로 결과를 채웁니다.
	public void completeWith(Integer roomCount, Integer bathroomCount, Boolean hasBalcony, String kitchenType,
			Integer spaceScore, Integer conditionScore, String issueTags, Long estimatedQuoteMin,
			Long estimatedQuoteMax, Long expectedRentIncreaseMin, Long expectedRentIncreaseMax,
			Integer paybackPeriodMonthsMin, Integer paybackPeriodMonthsMax) {
		this.roomCount = roomCount;
		this.bathroomCount = bathroomCount;
		this.hasBalcony = hasBalcony;
		this.kitchenType = kitchenType;
		this.spaceScore = spaceScore;
		this.conditionScore = conditionScore;
		this.issueTags = issueTags;
		this.estimatedQuoteMin = estimatedQuoteMin;
		this.estimatedQuoteMax = estimatedQuoteMax;
		this.expectedRentIncreaseMin = expectedRentIncreaseMin;
		this.expectedRentIncreaseMax = expectedRentIncreaseMax;
		this.paybackPeriodMonthsMin = paybackPeriodMonthsMin;
		this.paybackPeriodMonthsMax = paybackPeriodMonthsMax;
		this.status = AnalysisStatus.COMPLETED;
	}

	// ⭐ [프론트 연동] "공간 정보 확인" 화면에서 임대인이 AI가 인식한 방 개수/욕실 개수/발코니 유무/주방 형태를
	// 직접 고쳐 저장할 수 있어야 함(값이 null인 필드는 변경하지 않음 - 부분 수정 허용).
	public void updateBasicInfo(Integer roomCount, Integer bathroomCount, Boolean hasBalcony, String kitchenType,
			Double ceilingHeightM) {
		if (roomCount != null) {
			this.roomCount = roomCount;
		}
		if (bathroomCount != null) {
			this.bathroomCount = bathroomCount;
		}
		if (hasBalcony != null) {
			this.hasBalcony = hasBalcony;
		}
		if (kitchenType != null) {
			this.kitchenType = kitchenType;
		}
		if (ceilingHeightM != null) {
			this.ceilingHeightM = ceilingHeightM;
		}
	}

	// ⭐ [프론트 연동] AnalysisJobService.replaceSpaces()가 공간 목록을 다시 저장할 때마다 호출해 갱신합니다.
	public void applyTotalConstructionArea(Double totalFloorAreaM2, Double totalWallpaperAreaM2) {
		this.totalFloorAreaM2 = totalFloorAreaM2;
		this.totalWallpaperAreaM2 = totalWallpaperAreaM2;
	}

	public void fail() {
		this.status = AnalysisStatus.FAILED;
	}

	public void updateMatchingScore(int matchingScore) {
		this.matchingScore = matchingScore;
	}

	// ⭐ [고도화] 시공사 매칭 전 예비 임대가치 상승분 반영 (AnalysisJobService.requestAnalysis 참고)
	public void applyPreliminaryRentalValue(Long depositIncreaseMin, Long depositIncreaseMax, Long rentIncreaseMin,
			Long rentIncreaseMax) {
		this.preliminaryDepositIncreaseMin = depositIncreaseMin;
		this.preliminaryDepositIncreaseMax = depositIncreaseMax;
		this.preliminaryRentIncreaseMin = rentIncreaseMin;
		this.preliminaryRentIncreaseMax = rentIncreaseMax;
	}

	// ⭐ [고도화] 시공사 견적 수락 시점의 확정 임대가치 상승분 반영 (ContractorQuoteService.accept 참고)
	public void applyConfirmedRentalValue(Long depositIncreaseMin, Long depositIncreaseMax, Long rentIncreaseMin,
			Long rentIncreaseMax) {
		this.depositIncreaseMin = depositIncreaseMin;
		this.depositIncreaseMax = depositIncreaseMax;
		this.expectedRentIncreaseMin = rentIncreaseMin;
		this.expectedRentIncreaseMax = rentIncreaseMax;
	}
}
