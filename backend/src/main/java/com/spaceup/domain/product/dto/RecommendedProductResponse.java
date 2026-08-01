package com.spaceup.domain.product.dto;

// ⭐ [프론트 연동] "추천 상품" 화면. imageUrl은 Product 엔티티에 이미지 필드가 아직 없어 항상 null입니다
// (내부용 보고서에 스키마 보강 필요 항목으로 정리했습니다 - 우선 domain/files의 범용 업로드 API로 벤더가
// 상품 등록 시 이미지를 올리게 하고 Product에 imageUrl 컬럼을 추가하는 후속 작업이 필요합니다).
public record RecommendedProductResponse(
		Long productId,
		String productName,
		String vendorName,
		String imageUrl,
		Long unitPrice,
		Integer quantity,
		Long amount,
		String reason) {
}
