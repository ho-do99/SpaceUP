package com.spaceup.domain.schedule.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ PDF "일정관리" 화면 - 견적이 확정된 후 시공사가 일정을 등록할 때 사용
@Getter
@Setter
@NoArgsConstructor
public class ScheduleCreateRequest {

	@NotNull(message = "의뢰 번호는 필수입니다.")
	private Long requestId;

	@NotBlank(message = "일정 제목은 필수입니다.")
	private String title;

	@NotNull(message = "예정 일시는 필수입니다.")
	private LocalDateTime scheduledAt;
}
