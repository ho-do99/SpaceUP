package com.spaceup.domain.schedule.dto;

import java.time.LocalDateTime;

import com.spaceup.domain.schedule.entity.ScheduleEvent;
import com.spaceup.domain.schedule.entity.ScheduleStatus;

import lombok.Getter;

@Getter
public class ScheduleResponse {
	private final Long id;
	private final Long requestId;
	private final Long contractorId;
	private final String title;
	private final LocalDateTime scheduledAt;
	private final ScheduleStatus status;

	public ScheduleResponse(ScheduleEvent event) {
		this.id = event.getId();
		this.requestId = event.getRequest().getId();
		this.contractorId = event.getContractor().getId();
		this.title = event.getTitle();
		this.scheduledAt = event.getScheduledAt();
		this.status = event.getStatus();
	}
}
