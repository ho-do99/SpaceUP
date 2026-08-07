package com.spaceup.domain.material.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.spaceup.domain.material.entity.MaterialPriceTier;
import com.spaceup.domain.material.entity.MaterialProduct;
import com.spaceup.domain.material.entity.MaterialTheme;
import com.spaceup.domain.material.entity.MaterialWorkType;

public record MaterialProductResponse(Long productId, MaterialWorkType workType, String materialCategory,
		MaterialTheme theme, MaterialPriceTier priceTier, String brandName, String productName, String modelCode,
		String productUrl, String imageUrl, String saleUnit, BigDecimal coveragePerUnitM2,
		BigDecimal currentPrice, BigDecimal normalizedPriceM2, String specJson, LocalDateTime priceCheckedAt) {
	public static MaterialProductResponse from(MaterialProduct product) {
		return new MaterialProductResponse(product.getId(), product.getWorkType(), product.getMaterialCategory(),
				product.getTheme(), product.getPriceTier(), product.getBrandName(), product.getProductName(),
				product.getModelCode(), product.getProductUrl(), product.getImageUrl(), product.getSaleUnit(),
				product.getCoveragePerUnitM2(), product.getCurrentPrice(), product.getNormalizedPriceM2(),
				product.getSpecJson(), product.getPriceCheckedAt());
	}
}
