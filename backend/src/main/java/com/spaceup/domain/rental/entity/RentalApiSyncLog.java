package com.spaceup.domain.rental.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "rental_api_sync_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RentalApiSyncLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "rental_api_sync_log_id")
	private Long id;

	@Column(name = "lawd_cd", nullable = false, length = 5)
	private String lawdCd;

	@Column(name = "deal_ym", nullable = false, length = 6)
	private String dealYm;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private RentalSyncStatus status;

	@Column(name = "started_at", nullable = false)
	private LocalDateTime startedAt;

	@Column(name = "finished_at")
	private LocalDateTime finishedAt;

	@Column(name = "api_total_count", nullable = false)
	private int apiTotalCount;

	@Column(name = "received_count", nullable = false)
	private int receivedCount;

	@Column(name = "inserted_count", nullable = false)
	private int insertedCount;

	@Column(name = "duplicate_count", nullable = false)
	private int duplicateCount;

	@Column(name = "failed_count", nullable = false)
	private int failedCount;

	@Column(name = "error_code", length = 50)
	private String errorCode;

	@Column(name = "error_message", length = 500)
	private String errorMessage;

	public static RentalApiSyncLog start(String lawdCd, String dealYm) {
		RentalApiSyncLog log = new RentalApiSyncLog();
		log.lawdCd = lawdCd;
		log.dealYm = dealYm;
		log.status = RentalSyncStatus.RUNNING;
		log.startedAt = LocalDateTime.now();
		return log;
	}

	public void complete(
			int apiTotal,
			int received,
			int inserted,
			int duplicates,
			int failed) {
		status = failed == 0
				? RentalSyncStatus.SUCCESS
				: RentalSyncStatus.PARTIAL_SUCCESS;
		updateCounts(apiTotal, received, inserted, duplicates, failed);
		finishedAt = LocalDateTime.now();
		errorCode = null;
		errorMessage = null;
	}

	public void fail(
			RentalSyncStatus terminalStatus,
			int apiTotal,
			int received,
			int inserted,
			int duplicates,
			int failed,
			String errorCode,
			String errorMessage) {
		if (terminalStatus != RentalSyncStatus.FAILED
				&& terminalStatus != RentalSyncStatus.PARTIAL_SUCCESS) {
			throw new IllegalArgumentException("실패 종료 상태가 아닙니다: " + terminalStatus);
		}
		status = terminalStatus;
		updateCounts(apiTotal, received, inserted, duplicates, failed);
		finishedAt = LocalDateTime.now();
		this.errorCode = errorCode;
		this.errorMessage = errorMessage;
	}

	private void updateCounts(
			int apiTotal,
			int received,
			int inserted,
			int duplicates,
			int failed) {
		apiTotalCount = apiTotal;
		receivedCount = received;
		insertedCount = inserted;
		duplicateCount = duplicates;
		failedCount = failed;
	}
}
