package com.spaceup.domain.schedule.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.global.entity.BaseTimeEntity;
import com.spaceup.global.error.InvalidStatusTransitionException;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ PDF "일정관리" 화면(월간/목록, 예정/진행중/완료). 시공사가 확정한 견적(Quote)을 기준으로 생성됩니다.
@Entity
@Table(name = "schedule_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ScheduleEvent extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "contractor_id", nullable = false)
	private Member contractor;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "request_id", nullable = false)
	private QuoteRequest request;

	@Column(nullable = false, length = 100)
	private String title; // 예: "광주 북구 오피스텔 도배·장판 시공"

	@Column(name = "scheduled_at", nullable = false)
	private LocalDateTime scheduledAt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ScheduleStatus status;

	// ⭐ [최종 검토 반영] complete()를 같은 일정에 반복 호출하면 시공사 실적(completedProjectCount)이
	// 계속 올라가는 부작용이 있었습니다. 상태 가드를 추가해 완료된 일정은 재처리되지 않도록 막습니다.
	public void reschedule(LocalDateTime newTime) {
		if (this.status == ScheduleStatus.COMPLETED) {
			throw new InvalidStatusTransitionException("이미 완료된 일정은 변경할 수 없습니다.");
		}
		this.scheduledAt = newTime;
	}

	public void start() {
		validateStatus(ScheduleStatus.SCHEDULED);
		this.status = ScheduleStatus.IN_PROGRESS;
	}

	public void complete() {
		validateStatus(ScheduleStatus.IN_PROGRESS);
		this.status = ScheduleStatus.COMPLETED;
	}

	private void validateStatus(ScheduleStatus expected) {
		if (this.status != expected) {
			throw new InvalidStatusTransitionException(
					String.format("현재 상태(%s)에서는 처리할 수 없습니다. 예상 상태: %s", this.status, expected));
		}
	}
}
