package com.spaceup.domain.quote.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [Figma 반영] "유효기간 연장" 화면 입력값
@Getter
@Setter
@NoArgsConstructor
public class ContractorQuoteExtendRequest {

	@NotNull(message = "새 만료일은 필수입니다.")
	@Future(message = "새 만료일은 미래 날짜여야 합니다.")
	private LocalDate newValidUntil;

	private String memo; // 연장 메모 (고객 안내용, 응답에는 별도 저장하지 않고 알림 문구에만 사용)
}
