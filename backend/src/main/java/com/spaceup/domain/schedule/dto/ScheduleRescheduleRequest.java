package com.spaceup.domain.schedule.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ScheduleRescheduleRequest {

	@NotNull(message = "변경할 일시는 필수입니다.")
	private LocalDateTime scheduledAt;
}
