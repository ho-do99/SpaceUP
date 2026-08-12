package com.spaceup.domain.rental.dto;

import com.spaceup.domain.rental.entity.RentalSyncStatus;

public record RentalSyncResponse(
		long syncLogId,
		String lawdCd,
		String dealYm,
		int apiTotalCount,
		int receivedCount,
		int insertedCount,
		int duplicateCount,
		int failedCount,
		RentalSyncStatus status) {
}
