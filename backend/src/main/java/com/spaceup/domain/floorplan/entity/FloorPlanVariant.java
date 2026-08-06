package com.spaceup.domain.floorplan.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ 아파트 1곳당 면적 타입별 평면도(예: 59㎡형/74㎡형/84㎡형). 프론트
// ApartmentAddressSearchPage의 floorPlans[] 항목(exclusiveArea/supplyArea/typeLabel/floorPlanSrc)에 대응
@Entity
@Table(name = "floorplan_variants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class FloorPlanVariant extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "apartment_id", nullable = false)
	private Apartment apartment;

	@Column(name = "exclusive_area_m2", nullable = false)
	private Double exclusiveAreaM2; // 전용면적

	@Column(name = "supply_area_m2")
	private Double supplyAreaM2; // 공급면적

	@Column(name = "type_label", length = 30)
	private String typeLabel; // 예: "기본형", "테라스형"

	@Column(name = "room_count")
	private Integer roomCount; // 검색 필터용

	@Column(name = "floor_plan_image_url", length = 300)
	private String floorPlanImageUrl;

	void assignApartment(Apartment apartment) {
		this.apartment = apartment;
	}
}
