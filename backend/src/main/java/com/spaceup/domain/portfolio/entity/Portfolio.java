package com.spaceup.domain.portfolio.entity;

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
 * ⭐ [Figma 반영] "포트폴리오 관리/등록/수정" 화면 - 시공사가 완료한 시공 사례를 등록해 고객에게 공개하는 도메인입니다.
 * 기존 ContractorProfile.portfolioUrl 단일 필드로는 "12건 등록, 10건 공개" 같은 여러 건 관리가
 * 불가능해서 별도 엔티티로 분리했습니다. Member(시공사) : Portfolio = 1 : N 관계입니다.
 */
@Entity
@Table(name = "portfolios")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Portfolio extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "contractor_id", nullable = false)
	private Member contractor;

	@Column(name = "project_name", nullable = false, length = 100)
	private String projectName; // 프로젝트명 (예: "성수 오피스텔 리모델링")

	@Column(name = "region", length = 50)
	private String region; // 지역

	@Column(name = "property_type", length = 20)
	private String propertyType; // 주택 유형 (오피스텔/아파트 등)

	@Column(name = "area_m2")
	private Double areaM2; // 면적(㎡)

	@Column(name = "work_items", length = 200)
	private String workItems; // 시공 항목 (콤마 구분, 예: "바닥,도배,조명")

	@Column(name = "duration_days")
	private Integer durationDays; // 시공 기간(일)

	@Column(name = "amount")
	private Long amount; // 공사 금액(원)

	@Column(name = "main_image_url", length = 500)
	private String mainImageUrl; // 대표 이미지

	@Column(name = "photo_urls", length = 2000)
	private String photoUrls; // 시공 사진 (콤마 구분 URL 목록)

	@Builder.Default
	@Column(name = "is_public", nullable = false)
	private boolean isPublic = true; // 공개 여부

	public void update(String projectName, String region, String propertyType, Double areaM2, String workItems,
			Integer durationDays, Long amount, String mainImageUrl, String photoUrls) {
		this.projectName = projectName;
		this.region = region;
		this.propertyType = propertyType;
		this.areaM2 = areaM2;
		this.workItems = workItems;
		this.durationDays = durationDays;
		this.amount = amount;
		this.mainImageUrl = mainImageUrl;
		this.photoUrls = photoUrls;
	}

	public void changeVisibility(boolean isPublic) {
		this.isPublic = isPublic;
	}
}
