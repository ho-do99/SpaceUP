package com.spaceup.domain.visit.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.spaceup.domain.visit.entity.SiteVisit;
import com.spaceup.domain.visit.entity.SiteVisitStatus;

public record SiteVisitResponse(
		Long id,
		Long requestId,
		Long contractorId,
		SiteVisitStatus status,
		LocalDate visitDate,
		LocalTime visitTime,
		String address,
		String managerName,
		String note,
		LocalDateTime completedAt,
		LocalDate requestedDate,
		LocalTime requestedTime,
		String requestReason) {

	public SiteVisitResponse(SiteVisit visit) {
		this(visit.getId(), visit.getRequest().getId(), visit.getContractor().getId(), visit.getStatus(),
				visit.getVisitDate(), visit.getVisitTime(),
				visit.getRequest().getProperty().getRegion(), visit.getManagerName(), visit.getNote(),
				visit.getCompletedAt(), visit.getRequestedDate(), visit.getRequestedTime(), visit.getRequestReason());
	}
}
