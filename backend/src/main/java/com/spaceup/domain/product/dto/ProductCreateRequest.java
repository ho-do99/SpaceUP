package com.spaceup.domain.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.spaceup.domain.product.entity.ProductCategory;

// ⭐ PDF "자재 등록/수정" 화면 입력 항목 그대로 매핑
@Getter
@Setter
@NoArgsConstructor
public class ProductCreateRequest {

	@NotBlank(message = "상품명은 필수 입력 사항입니다.")
	private String name;

	@NotNull(message = "카테고리를 선택해 주세요.")
	private ProductCategory category;

	private String spec;
	private String color;

	@NotNull(message = "공급가는 필수 입력 사항입니다.")
	@Positive(message = "공급가는 0보다 커야 합니다.")
	private Long supplyPrice;

	@NotNull(message = "판매가는 필수 입력 사항입니다.")
	@Positive(message = "판매가는 0보다 커야 합니다.")
	private Long salePrice;

	@NotNull(message = "최소 주문 수량은 필수 입력 사항입니다.")
	private Integer minOrderQty;

	@NotNull(message = "현재 재고는 필수 입력 사항입니다.")
	private Integer stockQty;

	private String manufacturer;
	private String brand;
	private String productCode; // 미입력 시 서비스에서 자동 채번
}
