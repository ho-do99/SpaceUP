package com.spaceup.domain.floorplan.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
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
import com.spaceup.domain.floorplan.repository.FloorPlanVariantRepository;
import com.spaceup.global.config.ObjectStorageProperties;
import com.spaceup.global.error.ApartmentNotFoundException;
import com.spaceup.global.error.FileNotFoundException;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.S3Exception;

// ⭐ [프론트 연동] "아파트/평면도 검색" 화면. 아직 실제 데이터가 없는 빈 카탈로그로 시작하며, 관리자가
// 이후 이 API로 실제 아파트/평면도 데이터를 채워 넣는 구조입니다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApartmentService {

	private final ApartmentRepository apartmentRepository;
	private final FloorPlanVariantRepository floorPlanVariantRepository;
	private final ObjectStorageProperties objectStorageProperties;
	private final ObjectProvider<S3Client> objectStorageClientProvider;

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

	// ⭐ [Object Storage 등록 평면도] Object Storage가 꺼져 있으면(현재 시드 데이터처럼) floorPlanImageUrl을
	// 이미 완성된 외부 URL로 보고 컨트롤러가 그대로 리다이렉트합니다. 켜져 있으면 그 값을 object key로 보고
	// 이 서비스가 직접 바이트를 읽어와 프론트에 스트리밍합니다(브라우저가 private bucket에 직접 접근할 필요 없음).
	public boolean usesObjectStorageForImages() {
		return objectStorageProperties.enabled();
	}

	public String getVariantImageUrl(Long variantId) {
		return findVariantOrThrow(variantId).getFloorPlanImageUrl();
	}

	public Resource loadVariantImage(Long variantId) {
		String objectKey = findVariantOrThrow(variantId).getFloorPlanImageUrl();
		if (objectKey == null || objectKey.isBlank()) {
			throw new FileNotFoundException("등록된 평면도 이미지가 없습니다: " + variantId);
		}
		S3Client client = objectStorageClientProvider.getIfAvailable();
		if (client == null) {
			throw new IllegalStateException("Object Storage 클라이언트가 설정되지 않았습니다.");
		}
		try {
			byte[] bytes = client
					.getObjectAsBytes(
							GetObjectRequest.builder().bucket(objectStorageProperties.bucket()).key(objectKey).build())
					.asByteArray();
			return new ByteArrayResource(bytes);
		} catch (NoSuchKeyException e) {
			throw new FileNotFoundException("Object Storage에서 평면도 파일을 찾을 수 없습니다: " + objectKey);
		} catch (S3Exception e) {
			if (e.statusCode() == 404) {
				throw new FileNotFoundException("Object Storage에서 평면도 파일을 찾을 수 없습니다: " + objectKey);
			}
			throw new IllegalStateException("Object Storage에서 평면도 파일을 읽는 중 오류가 발생했습니다(권한 오류 가능성 포함).", e);
		}
	}

	public MediaType getVariantImageMediaType(Long variantId) {
		return resolveImageMediaType(findVariantOrThrow(variantId).getFloorPlanImageUrl());
	}

	static MediaType resolveImageMediaType(String objectKey) {
		String lower = objectKey == null ? "" : objectKey.toLowerCase();
		if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
		if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
		return MediaType.IMAGE_JPEG;
	}

	private FloorPlanVariant findVariantOrThrow(Long variantId) {
		return floorPlanVariantRepository.findById(variantId)
				.orElseThrow(() -> new FileNotFoundException("존재하지 않는 평면도입니다: " + variantId));
	}

	private String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value;
	}

	private Apartment findOrThrow(Long apartmentId) {
		return apartmentRepository.findById(apartmentId)
				.orElseThrow(() -> new ApartmentNotFoundException("존재하지 않는 아파트입니다: " + apartmentId));
	}
}
