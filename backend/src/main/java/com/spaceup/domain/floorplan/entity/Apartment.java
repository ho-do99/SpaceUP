package com.spaceup.domain.floorplan.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ [프론트 연동] "아파트/평면도 검색" 화면(ApartmentAddressSearchPage). 지금은 데이터가 전혀 없는 빈
// 카탈로그로 시작하며, 관리자 등록 API로 이후 실제 데이터를 채워 넣는 구조입니다.
@Entity
@Table(name = "apartments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Apartment extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String name;

	@Column(name = "road_address", length = 200)
	private String roadAddress;

	@Column(name = "lot_address", length = 200)
	private String lotAddress;

	// ⭐ 검색 필터용 태그 (예: "광주 북구")
	@Column(length = 50)
	private String region;

	@Builder.Default
	@OneToMany(mappedBy = "apartment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	private List<FloorPlanVariant> variants = new ArrayList<>();

	public void addVariant(FloorPlanVariant variant) {
		variants.add(variant);
		variant.assignApartment(this);
	}
}
