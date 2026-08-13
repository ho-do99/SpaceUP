package com.spaceup.domain.floorplan.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.floorplan.dto.ApartmentCreateRequest;
import com.spaceup.domain.floorplan.dto.ApartmentResponse;
import com.spaceup.domain.floorplan.dto.FloorPlanVariantCreateRequest;
import com.spaceup.domain.floorplan.entity.Apartment;
import com.spaceup.domain.floorplan.entity.FloorPlanVariant;
import com.spaceup.domain.floorplan.repository.ApartmentRepository;
import com.spaceup.global.error.ApartmentNotFoundException;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "아파트/평면도 검색" 화면. 아직 실제 데이터가 없는 빈 카탈로그로 시작하며, 관리자가
// 이후 이 API로 실제 아파트/평면도 데이터를 채워 넣는 구조입니다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApartmentService {

	private final ApartmentRepository apartmentRepository;

	@Transactional
	public Long createApartment(ApartmentCreateRequest dto) {
		Apartment apartment = Apartment.builder().name(dto.getName()).roadAddress(dto.getRoadAddress())
				.lotAddress(dto.getLotAddress()).region(dto.getRegion()).build();
		apartmentRepository.save(apartment);
		return apartment.getId();
	}

	@Transactional
	public Long addVariant(Long apartmentId, FloorPlanVariantCreateRequest dto) {
		Apartment apartment = findOrThrow(apartmentId);
		FloorPlanVariant variant = FloorPlanVariant.builder().exclusiveAreaM2(dto.getExclusiveAreaM2())
				.supplyAreaM2(dto.getSupplyAreaM2()).typeLabel(dto.getTypeLabel()).roomCount(dto.getRoomCount())
				.floorPlanImageUrl(dto.getFloorPlanImageUrl()).build();
		apartment.addVariant(variant);
		return variant.getId();
	}

	public ApartmentResponse getApartment(Long apartmentId) {
		return new ApartmentResponse(findOrThrow(apartmentId));
	}

	// ⭐ 키워드(이름/주소)·지역·전용면적범위·방개수 전부 선택 입력 - 태그/메타데이터 기반 검색
	public Page<ApartmentResponse> search(String keyword, String region, Double minAreaM2, Double maxAreaM2,
			Integer roomCount, Pageable pageable) {
		return apartmentRepository.search(blankToNull(keyword), blankToNull(region), minAreaM2, maxAreaM2, roomCount,
				pageable).map(ApartmentResponse::new);
	}

	private String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value;
	}

	private Apartment findOrThrow(Long apartmentId) {
		return apartmentRepository.findById(apartmentId)
				.orElseThrow(() -> new ApartmentNotFoundException("존재하지 않는 아파트입니다: " + apartmentId));
	}
}
