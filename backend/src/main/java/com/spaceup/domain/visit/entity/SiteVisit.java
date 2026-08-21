package com.spaceup.domain.visit.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

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

// ⭐ [프론트 연동] "현장방문 예약" 화면. 견적 작성 이전, 의뢰 승인 직후부터 시작되는 별도 흐름이라
// 공사 진행(ContractorProject)의 착공·완공 일정과 구분되는 계약 전 현장 방문 일정입니다.
@Entity
@Table(name = "site_visits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SiteVisit extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "request_id", nullable = false)
	private QuoteRequest request;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "contractor_id", nullable = false)
	private Member contractor;

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private SiteVisitStatus status = SiteVisitStatus.UNSCHEDULED;

	private LocalDate visitDate;
	private LocalTime visitTime;

	@Column(length = 50)
	private String managerName;

	@Column(length = 300)
	private String note;

	private LocalDateTime completedAt;

	// ⭐ 임대인이 변경을 요청한 시점의 "새로 원하는" 날짜/시간/사유. CHANGE_REQUESTED 상태에서만 값이 존재합니다.
	private LocalDate requestedDate;
	private LocalTime requestedTime;

	@Column(length = 300)
	private String requestReason;

	// ⭐ PDF "방문 일정 등록" - 최초 등록만 가능(UNSCHEDULED에서만). 이미 잡힌 일정을 바꾸려면
	// propose()("다른 일정 제안")를 쓰도록 분리해, 완료된 방문이 실수로 재등록되며 completedAt은 그대로
	// 남은 채 SCHEDULED로 되돌아가는 걸 막습니다.
	public void schedule(LocalDate visitDate, LocalTime visitTime, String managerName, String note) {
		validateStatus(SiteVisitStatus.UNSCHEDULED);
		applySchedule(visitDate, visitTime, managerName, note);
	}

	// ⭐ 시공사의 "다른 일정 제안" - 이미 일정이 있거나(SCHEDULED) 변경 요청이 걸려있을 때(CHANGE_REQUESTED)만
	public void propose(LocalDate visitDate, LocalTime visitTime, String note) {
		if (status != SiteVisitStatus.SCHEDULED && status != SiteVisitStatus.CHANGE_REQUESTED) {
			throw new InvalidStatusTransitionException(
					String.format("현재 상태(%s)에서는 다른 일정을 제안할 수 없습니다.", status));
		}
		applySchedule(visitDate, visitTime, this.managerName, note);
	}

	private void applySchedule(LocalDate visitDate, LocalTime visitTime, String managerName, String note) {
		this.visitDate = visitDate;
		this.visitTime = visitTime;
		this.managerName = managerName;
		this.note = note;
		this.status = SiteVisitStatus.SCHEDULED;
		clearChangeRequest();
	}

	// ⭐ 임대인(고객)이 다른 일정을 요청 - 이미 일정이 잡혀 있어야만 변경을 요청할 수 있습니다.
	public void requestChange(LocalDate requestedDate, LocalTime requestedTime, String reason) {
		if (status != SiteVisitStatus.UNSCHEDULED) {
			validateStatus(SiteVisitStatus.SCHEDULED);
		}
		this.requestedDate = requestedDate;
		this.requestedTime = requestedTime;
		this.requestReason = reason;
		this.status = SiteVisitStatus.CHANGE_REQUESTED;
	}

	// ⭐ 시공사가 임대인의 변경 요청을 수락 - 요청받은 일정으로 확정
	public void acceptChangeRequest() {
		validateStatus(SiteVisitStatus.CHANGE_REQUESTED);
		this.visitDate = this.requestedDate;
		this.visitTime = this.requestedTime;
		this.status = SiteVisitStatus.SCHEDULED;
		clearChangeRequest();
	}

	// ⭐ 시공사가 임대인의 변경 요청을 거절 - 기존 일정 유지
	public void rejectChangeRequest() {
		validateStatus(SiteVisitStatus.CHANGE_REQUESTED);
		this.status = this.visitDate == null || this.visitTime == null
				? SiteVisitStatus.UNSCHEDULED
				: SiteVisitStatus.SCHEDULED;
		clearChangeRequest();
	}

	// ⭐ 방문 완료는 일정이 확정된 상태(SCHEDULED)에서만 - UNSCHEDULED/이미 COMPLETED에서는 불가
	public void complete(String note) {
		validateStatus(SiteVisitStatus.SCHEDULED);
		this.status = SiteVisitStatus.COMPLETED;
		this.completedAt = LocalDateTime.now();
		if (note != null && !note.isBlank()) {
			this.note = note;
		}
	}

	private void validateStatus(SiteVisitStatus expected) {
		if (this.status != expected) {
			throw new InvalidStatusTransitionException(
					String.format("현재 상태(%s)에서는 처리할 수 없습니다. 예상 상태: %s", this.status, expected));
		}
	}

	private void clearChangeRequest() {
		this.requestedDate = null;
		this.requestedTime = null;
		this.requestReason = null;
	}
}
