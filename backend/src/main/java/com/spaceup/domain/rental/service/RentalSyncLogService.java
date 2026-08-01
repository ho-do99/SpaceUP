package com.spaceup.domain.rental.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.rental.entity.RentalApiSyncLog;
import com.spaceup.domain.rental.entity.RentalSyncStatus;
import com.spaceup.domain.rental.repository.RentalApiSyncLogRepository;

@Service
public class RentalSyncLogService {

	private static final int ERROR_MESSAGE_MAX_LENGTH = 500;

	private final RentalApiSyncLogRepository repository;

	public RentalSyncLogService(RentalApiSyncLogRepository repository) {
		this.repository = repository;
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public long start(String lawdCd, String dealYm) {
		return repository.save(RentalApiSyncLog.start(lawdCd, dealYm)).getId();
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void complete(
			long logId,
			int apiTotal,
			int received,
			int inserted,
			int duplicates,
			int failed) {
		find(logId).complete(apiTotal, received, inserted, duplicates, failed);
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void failure(
			long logId,
			RentalSyncStatus status,
			int apiTotal,
			int received,
			int inserted,
			int duplicates,
			int failed,
			String errorCode,
			String errorMessage) {
		find(logId).fail(status, apiTotal, received, inserted, duplicates, failed,
				errorCode, truncate(errorMessage));
	}

	private RentalApiSyncLog find(long logId) {
		return repository.findById(logId)
				.orElseThrow(() -> new IllegalStateException(
						"전월세 API 동기화 이력을 찾을 수 없습니다: " + logId));
	}

	private String truncate(String message) {
		if (message == null || message.length() <= ERROR_MESSAGE_MAX_LENGTH) {
			return message;
		}
		return message.substring(0, ERROR_MESSAGE_MAX_LENGTH);
	}
}
