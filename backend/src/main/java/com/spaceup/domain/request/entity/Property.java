package com.spaceup.domain.request.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * ⭐ [DB 명칭 정합화] DB팀 명세의 property에 대응합니다. 기존엔 매물 속성이 Request 안에 뒤섞여 있었는데,
 * PDF 구조대로 매물(Property)과 견적요청 워크플로우(QuoteRequest)를 분리했습니다. 컨트롤러는 따로 없고
 * QuoteRequest 생성(RequestService.createRequest) 시점에 함께 생성됩니다.
 *
 * PDF의 property는 주소/건축물대장/건물구조 등 훨씬 많은 컬럼을 갖고 있지만, 지금 화면/로직이 채울 수 있는
 * 필드(기존 Request가 갖고 있던 것)만 옮겼습니다. 나머지는 그 데이터를 실제로 입력받는 화면이 생길 때 추가합니다.
 */
@Entity
@Table(name = "property")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Property extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "property_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "owner_id", nullable = false)
	private Member owner; // 매물 소유자(임대인)

	// ⭐ PDF엔 없는 필드지만(대신 road_address/lot_address 등 상세 주소를 씀) 그룹 B 전용으로 유지합니다.
	@Column(nullable = false, length = 50)
	private String region; // 지역 (예: 광주 북구)

	@Column(name = "housing_type", nullable = false, length = 20)
	private String housingType; // 주택 유형 (아파트/오피스텔/빌라 등)

	@Column(name = "exclusive_area_m2", nullable = false)
	private Double exclusiveAreaM2; // 전용 면적(㎡)

	@Column(name = "current_deposit")
	private Long currentDeposit; // 현재 보증금(원)

	@Column(name = "current_monthly_rent")
	private Long currentMonthlyRent; // 현재 월세(원)

	// ⭐ [프론트 연동] "공간 정보 확인" 화면에서 임대인이 AI 분석 결과의 면적을 직접 수정할 수 있어야 함
	// (AnalysisJobService.updateBasicInfo 참고). 면적은 Property가 갖고 있어 여기서 함께 수정합니다.
	public void updateArea(Double exclusiveAreaM2) {
		this.exclusiveAreaM2 = exclusiveAreaM2;
	}

	// ⭐ [프론트 연동] PATCH /api/requests/{requestId} - 화면 뒤쪽 단계에서 값이 채워지는 필드들을 부분 수정.
	// 값을 보낸 필드만 반영되고, null인 필드는 기존 값을 유지합니다.
	public void updatePartial(String region, String housingType, Double exclusiveAreaM2, Long currentDeposit,
			Long currentMonthlyRent) {
		if (region != null) {
			this.region = region;
		}
		if (housingType != null) {
			this.housingType = housingType;
		}
		if (exclusiveAreaM2 != null) {
			this.exclusiveAreaM2 = exclusiveAreaM2;
		}
		if (currentDeposit != null) {
			this.currentDeposit = currentDeposit;
		}
		if (currentMonthlyRent != null) {
			this.currentMonthlyRent = currentMonthlyRent;
		}
	}
}
