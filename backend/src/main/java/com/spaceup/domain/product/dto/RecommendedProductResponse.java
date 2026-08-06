package com.spaceup.domain.product.dto;

import com.spaceup.domain.product.entity.ProductCategory;

// ⭐ [프론트 연동] "추천 상품" 화면. imageUrl은 Product에 이미지가 등록된 경우에만 채워지고, 미등록 상품은 null입니다.
public record RecommendedProductResponse(
		Long productId,
		String productName,
		ProductCategory category,
		String spec,
		String brand,
		String vendorName,
		String imageUrl,
		Long unitPrice,
		String unit,
		Integer quantity,
		Double coverageM2,
		Long amount,
		String reason,
		int priority) {
}
