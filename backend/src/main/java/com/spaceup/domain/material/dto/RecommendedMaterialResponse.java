package com.spaceup.domain.material.dto;

/**
 * 기존 추천 상품 API의 JSON 필드명을 보존하는 전환용 DTO입니다.
 * vendorName은 자재업체가 아니라 brand와 같은 값을 내보내는 폐기 예정 호환 필드입니다.
 */
public record RecommendedMaterialResponse(Long productId, String productName, String category, String spec,
		String brand, @Deprecated String vendorName, String imageUrl, Long unitPrice, String unit, Integer quantity,
		Double coverageM2, Long amount, String reason, int priority) {
}
