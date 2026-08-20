package com.spaceup.domain.quote.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ PDF "견적 작성" 화면 (기본/공사/자재/비용 탭)을 하나의 요청으로 통합
@Getter
@Setter
@NoArgsConstructor
public class ContractorQuoteCreateRequest {

	@NotNull(message = "의뢰 번호는 필수입니다.")
	private Long requestId;

	private String title;
	private String startDate;
	private Integer durationDays;

	@DecimalMin(value = "0.0", inclusive = false, message = "바닥 실측 면적은 0보다 커야 합니다.")
	@DecimalMax(value = "1000.0", message = "바닥 실측 면적은 1000㎡ 이하여야 합니다.")
	private BigDecimal floorAreaM2;

	@DecimalMin(value = "0.0", inclusive = false, message = "벽지 실측 면적은 0보다 커야 합니다.")
	@DecimalMax(value = "2000.0", message = "벽지 실측 면적은 2000㎡ 이하여야 합니다.")
	private BigDecimal wallpaperAreaM2;

	@Min(value = 1, message = "조명 수량은 1개 이상이어야 합니다.")
	@Max(value = 1000, message = "조명 수량은 1000개 이하여야 합니다.")
	private Integer lightingQuantity;

	@DecimalMin(value = "0.0", inclusive = false, message = "층고는 0보다 커야 합니다.")
	@DecimalMax(value = "10.0", message = "층고는 10m 이하여야 합니다.")
	private BigDecimal ceilingHeightM;

	@Min(value = 0, message = "방 개수는 0 이상이어야 합니다.")
	@Max(value = 20, message = "방 개수는 20개 이하여야 합니다.")
	private Integer roomCount;

	@Min(value = 0, message = "욕실 개수는 0 이상이어야 합니다.")
	@Max(value = 20, message = "욕실 개수는 20개 이하여야 합니다.")
	private Integer bathroomCount;

	@Size(max = 300, message = "현장 상태는 300자 이하여야 합니다.")
	private String siteCondition;

	private Long materialCost;
	private Long laborCost;
	private Long vat;
	private Long discount;
	private String detailContent;

	@NotEmpty(message = "견적 항목을 1개 이상 입력해 주세요.")
	@Valid
	private List<ContractorQuoteItemRequest> items;
}
