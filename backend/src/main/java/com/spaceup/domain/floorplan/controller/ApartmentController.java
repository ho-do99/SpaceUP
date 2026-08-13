package com.spaceup.domain.floorplan.controller;

import java.net.URI;

import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.floorplan.dto.ApartmentCreateRequest;
import com.spaceup.domain.floorplan.dto.ApartmentResponse;
import com.spaceup.domain.floorplan.dto.FloorPlanVariantCreateRequest;
import com.spaceup.domain.floorplan.service.ApartmentService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "아파트/평면도 검색" 화면(ApartmentAddressSearchPage)
@RestController
@RequestMapping("/api/floorplans/apartments")
@RequiredArgsConstructor
public class ApartmentController {

	private final ApartmentService apartmentService;

	// ⭐ 관리자용 아파트 등록 - 실제 데이터는 이후 별도로 채워 넣을 예정
	@PostMapping
	public ResponseEntity<ApiResponse<Long>> createApartment(@Valid @RequestBody ApartmentCreateRequest request) {
		return ResponseEntity.ok(ApiResponse.success("아파트가 등록되었습니다.", apartmentService.createApartment(request)));
	}

	@PostMapping("/{apartmentId}/variants")
	public ResponseEntity<ApiResponse<Long>> addVariant(@PathVariable Long apartmentId,
			@Valid @RequestBody FloorPlanVariantCreateRequest request) {
		return ResponseEntity
				.ok(ApiResponse.success("평면도가 등록되었습니다.", apartmentService.addVariant(apartmentId, request)));
	}

	@GetMapping("/{apartmentId}")
	public ResponseEntity<ApiResponse<ApartmentResponse>> getApartment(@PathVariable Long apartmentId) {
		return ResponseEntity.ok(ApiResponse.success("아파트 조회 완료", apartmentService.getApartment(apartmentId)));
	}

	// ⭐ [Object Storage 등록 평면도] Object Storage가 꺼져 있으면(현재 시드 데이터) floorPlanImageUrl을
	// 이미 완성된 외부 URL로 보고 그대로 302 리다이렉트합니다. 켜져 있으면(private bucket) 백엔드가 직접
	// 바이트를 읽어와 스트리밍합니다 - 프론트는 이 경로 하나만 <img src>로 쓰면 두 경우 모두 동작합니다.
	@GetMapping("/variants/{variantId}/image")
	public ResponseEntity<?> getVariantImage(@PathVariable Long variantId) {
		if (!apartmentService.usesObjectStorageForImages()) {
			return ResponseEntity.status(302).location(URI.create(apartmentService.getVariantImageUrl(variantId)))
					.build();
		}
		Resource resource = apartmentService.loadVariantImage(variantId);
		return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(resource);
	}

	// ⭐ 키워드/지역/면적범위/방개수 전부 선택 파라미터
	@GetMapping("/search")
	public ResponseEntity<ApiResponse<Page<ApartmentResponse>>> search(@RequestParam(required = false) String keyword,
			@RequestParam(required = false) String region, @RequestParam(required = false) Double minAreaM2,
			@RequestParam(required = false) Double maxAreaM2, @RequestParam(required = false) Integer roomCount,
			@PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success("아파트 검색 완료",
				apartmentService.search(keyword, region, minAreaM2, maxAreaM2, roomCount, pageable)));
	}
}
