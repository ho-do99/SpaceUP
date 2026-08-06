package com.spaceup.domain.visit.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ 임대인(고객)이 다른 방문 일정을 요청할 때 사용
@Getter
@Setter
@NoArgsConstructor
public class SiteVisitChangeRequest {

	@NotNull(message = "희망 날짜는 필수입니다.")
	private LocalDate requestedDate;

	@NotNull(message = "희망 시간은 필수입니다.")
	private LocalTime requestedTime;

	@NotBlank(message = "변경 사유는 필수입니다.")
	private String reason;
}
