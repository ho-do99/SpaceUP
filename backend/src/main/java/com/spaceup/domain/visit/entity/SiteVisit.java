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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ [프론트 연동] "현장방문 예약" 화면. 견적 작성 이전, 의뢰 승인 직후부터 시작되는 별도 흐름이라
// 공사 일정(ScheduleEvent)/공사 진행(ContractorProject)과는 별개 엔티티입니다.
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

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "request_id", nullable = false, unique = true)
	private QuoteRequest request;

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

	// ⭐ PDF "방문 일정 등록" - 최초 등록 및 이후 재등록(제안) 공용
	public void schedule(LocalDate visitDate, LocalTime visitTime, String managerName, String note) {
		this.visitDate = visitDate;
		this.visitTime = visitTime;
		this.managerName = managerName;
		this.note = note;
		this.status = SiteVisitStatus.SCHEDULED;
		clearChangeRequest();
	}

	// ⭐ 임대인(고객)이 다른 일정을 요청
	public void requestChange(LocalDate requestedDate, LocalTime requestedTime, String reason) {
		this.requestedDate = requestedDate;
		this.requestedTime = requestedTime;
		this.requestReason = reason;
		this.status = SiteVisitStatus.CHANGE_REQUESTED;
	}

	// ⭐ 시공사가 임대인의 변경 요청을 수락 - 요청받은 일정으로 확정
	public void acceptChangeRequest() {
		this.visitDate = this.requestedDate;
		this.visitTime = this.requestedTime;
		this.status = SiteVisitStatus.SCHEDULED;
		clearChangeRequest();
	}

	// ⭐ 시공사가 임대인의 변경 요청을 거절 - 기존 일정 유지
	public void rejectChangeRequest() {
		this.status = SiteVisitStatus.SCHEDULED;
		clearChangeRequest();
	}

	public void complete(String note) {
		this.status = SiteVisitStatus.COMPLETED;
		this.completedAt = LocalDateTime.now();
		if (note != null && !note.isBlank()) {
			this.note = note;
		}
	}

	private void clearChangeRequest() {
		this.requestedDate = null;
		this.requestedTime = null;
		this.requestReason = null;
	}
}
