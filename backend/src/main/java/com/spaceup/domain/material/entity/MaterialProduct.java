package com.spaceup.domain.material.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 업체 판매·재고 상품이 아닌, 사용자가 비교하는 읽기 전용 자재 카탈로그입니다. */
@Entity
@Table(name = "material_product")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MaterialProduct {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "product_id")
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(name = "work_type", nullable = false, length = 20)
	private MaterialWorkType workType;

	@Column(name = "material_category", nullable = false, length = 50)
	private String materialCategory;

	@Enumerated(EnumType.STRING)
	@Column(name = "theme", nullable = false, length = 20)
	private MaterialTheme theme;

	@Enumerated(EnumType.STRING)
	@Column(name = "price_tier", nullable = false, length = 20)
	private MaterialPriceTier priceTier;

	@Column(name = "brand_name", length = 100)
	private String brandName;
	@Column(name = "product_name", nullable = false)
	private String productName;
	@Column(name = "model_code", length = 100)
	private String modelCode;
	@Column(name = "source_name", nullable = false, length = 50)
	private String sourceName;
	@Column(name = "source_product_key", nullable = false, length = 150)
	private String sourceProductKey;
	@Column(name = "product_url", length = 1000)
	private String productUrl;
	@Column(name = "image_url", length = 1000)
	private String imageUrl;
	@Column(name = "sale_unit", nullable = false, length = 20)
	private String saleUnit;
	@Column(name = "coverage_per_unit_m2", precision = 10, scale = 3)
	private BigDecimal coveragePerUnitM2;
	@Column(name = "current_price", nullable = false, precision = 15)
	private BigDecimal currentPrice;
	@Column(name = "normalized_price_m2", precision = 15, scale = 2)
	private BigDecimal normalizedPriceM2;
	@Column(name = "spec_json", columnDefinition = "json")
	private String specJson;
	@Column(name = "verified_yn", nullable = false)
	private boolean verified;
	@Column(name = "price_checked_at", nullable = false)
	private LocalDateTime priceCheckedAt;
	@Column(name = "active_yn", nullable = false)
	private boolean active;
}
