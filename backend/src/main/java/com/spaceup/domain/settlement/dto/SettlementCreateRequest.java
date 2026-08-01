package com.spaceup.domain.settlement.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ PDF "정산/수수료 관리(관리자)" 화면. 실제로는 견적 완료/주문 완료 이벤트에서 서비스가 자동 생성하는 게 이상적이지만,
// 스캐폴드 단계에서는 수동 생성 API로 열어둡니다.
@Getter
@Setter
@NoArgsConstructor
public class SettlementCreateRequest {

	@NotNull(message = "정산 대상 회원 번호는 필수입니다.")
	private Long partnerId;

	@NotNull(message = "거래 금액은 필수입니다.")
	@Positive(message = "거래 금액은 0보다 커야 합니다.")
	private Long transactionAmount;
}
