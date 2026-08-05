package com.spaceup.domain.visit.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ 최초 등록("방문 일정 등록")과 재제안("다른 일정 제안") 공용 요청
@Getter
@Setter
@NoArgsConstructor
public class SiteVisitScheduleRequest {

	@NotNull(message = "방문 날짜는 필수입니다.")
	private LocalDate visitDate;

	@NotNull(message = "방문 시간은 필수입니다.")
	private LocalTime visitTime;

	private String managerName;
	private String note;
}
