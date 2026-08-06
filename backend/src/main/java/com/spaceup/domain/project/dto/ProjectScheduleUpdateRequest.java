package com.spaceup.domain.project.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ProjectScheduleUpdateRequest {

	@NotNull(message = "착공일은 필수입니다.")
	private LocalDate startDate;

	@NotNull(message = "완공 예정일은 필수입니다.")
	private LocalDate completionDate;

	@NotBlank(message = "변경 사유는 필수입니다.")
	private String reason;
}
