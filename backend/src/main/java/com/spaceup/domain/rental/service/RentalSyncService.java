package com.spaceup.domain.rental.service;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.spaceup.domain.rental.client.MolitRentalClient;
import com.spaceup.domain.rental.client.MolitRentalItem;
import com.spaceup.domain.rental.client.MolitRentalPage;
import com.spaceup.domain.rental.dto.RentalSyncResponse;
import com.spaceup.domain.rental.entity.RentalSyncStatus;
import com.spaceup.domain.rental.exception.RentalApiConfigurationException;
import com.spaceup.domain.rental.exception.RentalApiException;

@Service
public class RentalSyncService {

	private static final DateTimeFormatter DEAL_YM_FORMAT = DateTimeFormatter.ofPattern("yyyyMM");

	private final MolitRentalClient client;
	private final RentalTransactionMapper mapper;
	private final RentalTransactionWriter writer;
	private final RentalSyncLogService logService;

	public RentalSyncService(
			MolitRentalClient client,
			RentalTransactionMapper mapper,
			RentalTransactionWriter writer,
			RentalSyncLogService logService) {
		this.client = client;
		this.mapper = mapper;
		this.writer = writer;
		this.logService = logService;
	}

	public RentalSyncResponse sync(String lawdCd, YearMonth dealYm) {
		String dealYmText = dealYm.format(DEAL_YM_FORMAT);
		long logId = logService.start(lawdCd, dealYmText);
		int pageNo = 1;
		int apiTotal = 0;
		int received = 0;
		int inserted = 0;
		int duplicates = 0;
		int failed = 0;

		try {
			while (pageNo == 1 || received < apiTotal) {
				MolitRentalPage page = client.fetchPage(lawdCd, dealYm, pageNo);
				apiTotal = page.totalCount();
				if (page.items().isEmpty() && received < apiTotal) {
					throw new RentalApiException(
							"전체 건수에 도달하기 전에 빈 페이지를 받았습니다.");
				}

				for (MolitRentalItem item : page.items()) {
					received++;
					try {
						InsertResult result = writer.insertIfAbsent(mapper.map(item));
						if (result == InsertResult.INSERTED) {
							inserted++;
						} else {
							duplicates++;
						}
					} catch (DataIntegrityViolationException duplicateRace) {
						duplicates++;
					} catch (RuntimeException itemFailure) {
						failed++;
					}
				}
				pageNo++;
			}

			logService.complete(logId, apiTotal, received, inserted, duplicates, failed);
			RentalSyncStatus status = failed == 0
					? RentalSyncStatus.SUCCESS
					: RentalSyncStatus.PARTIAL_SUCCESS;
			return new RentalSyncResponse(
					logId,
					lawdCd,
					dealYmText,
					apiTotal,
					received,
					inserted,
					duplicates,
					failed,
					status);
		} catch (RentalApiConfigurationException e) {
			recordFailure(logId, received, apiTotal, inserted, duplicates, failed,
					"MOLIT_CONFIG_ERROR", e.getMessage());
			throw e;
		} catch (RentalApiException e) {
			recordFailure(logId, received, apiTotal, inserted, duplicates, failed,
					"MOLIT_API_ERROR", e.getMessage());
			throw e;
		}
	}

	private void recordFailure(
			long logId,
			int received,
			int apiTotal,
			int inserted,
			int duplicates,
			int failed,
			String errorCode,
			String errorMessage) {
		RentalSyncStatus status = received == 0
				? RentalSyncStatus.FAILED
				: RentalSyncStatus.PARTIAL_SUCCESS;
		logService.failure(logId, status, apiTotal, received,
				inserted, duplicates, failed, errorCode, errorMessage);
	}
}
