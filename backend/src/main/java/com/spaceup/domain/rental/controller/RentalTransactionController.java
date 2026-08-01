package com.spaceup.domain.rental.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.spaceup.domain.rental.dto.RentalSyncRequest;
import com.spaceup.domain.rental.dto.RentalSyncResponse;
import com.spaceup.domain.rental.dto.RentalTransactionResponse;
import com.spaceup.domain.rental.service.RentalQueryService;
import com.spaceup.domain.rental.service.RentalSyncService;
import com.spaceup.global.util.ApiResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

@RestController
@RequestMapping("/api/rental-transactions")
@Validated
public class RentalTransactionController {

	private final RentalSyncService syncService;
	private final RentalQueryService queryService;

	public RentalTransactionController(
			RentalSyncService syncService,
			RentalQueryService queryService) {
		this.syncService = syncService;
		this.queryService = queryService;
	}

	@PostMapping("/sync")
	public ResponseEntity<ApiResponse<RentalSyncResponse>> sync(
			@Valid @RequestBody RentalSyncRequest request) {
		RentalSyncResponse result =
				syncService.sync(request.lawdCd(), request.parsedDealYm());
		return ResponseEntity.ok(ApiResponse.success(
				"전월세 실거래가 동기화를 완료했습니다.", result));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<Page<RentalTransactionResponse>>> find(
			@RequestParam
			@Pattern(regexp = "\\d{5}", message = "lawdCd는 숫자 5자리여야 합니다.")
			String lawdCd,
			@RequestParam
			@Pattern(regexp = "\\d{6}", message = "dealYm은 yyyyMM 6자리여야 합니다.")
			String dealYm,
			@PageableDefault(size = 20) Pageable pageable) {
		Page<RentalTransactionResponse> result = queryService.find(
				lawdCd,
				RentalSyncRequest.parseDealYm(dealYm),
				pageable);
		return ResponseEntity.ok(ApiResponse.success(
				"전월세 실거래가 조회를 완료했습니다.", result));
	}
}
