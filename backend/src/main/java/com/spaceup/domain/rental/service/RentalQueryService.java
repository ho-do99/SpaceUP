package com.spaceup.domain.rental.service;

import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.rental.dto.RentalApartmentSearchResponse;
import com.spaceup.domain.rental.dto.RentalTransactionResponse;
import com.spaceup.domain.rental.entity.RentalTransaction;
import com.spaceup.domain.rental.repository.RentalTransactionRepository;

@Service
@Transactional(readOnly = true)
public class RentalQueryService {

	private final RentalTransactionRepository repository;

	public RentalQueryService(RentalTransactionRepository repository) {
		this.repository = repository;
	}

	public Page<RentalTransactionResponse> find(
			String lawdCd,
			YearMonth dealYm,
			Pageable pageable) {
		return repository.findBySggCodeAndDealYearAndDealMonth(
				lawdCd,
				dealYm.getYear(),
				dealYm.getMonthValue(),
				pageable)
				.map(RentalTransactionResponse::from);
	}

	// ⭐ [아파트 검색] sggCode/keyword 둘 다 선택값(둘 다 null이면 전체 대상). 실거래 원본은 최신순으로
	// 전부 불러온 뒤, (아파트명+전용면적) 기준으로 첫 번째로 만나는(=가장 최신) 거래만 대표로 남기고
	// 나머지 중복은 버립니다. 그 다음 요청받은 페이지 구간만 잘라서 돌려줍니다.
	//
	// ⚠️ 전체 목록을 메모리에 올려 처리하는 방식이라, 동기화된 데이터가 아주 많아지면(수만 건 이상) DB
	// 레벨 집계 쿼리로 바꾸는 게 좋습니다 - 지금 규모(캠퍼스 프로젝트, 지역/월 단위 동기화)에서는 충분합니다.
	public Page<RentalApartmentSearchResponse> searchApartments(String sggCode, String keyword, Pageable pageable) {
		List<RentalTransaction> transactions = repository.searchForApartments(blankToNull(sggCode),
				blankToNull(keyword));

		Map<String, RentalTransaction> deduplicated = new LinkedHashMap<>();
		for (RentalTransaction transaction : transactions) {
			String dedupKey = transaction.getApartmentName() + "|" + transaction.getExclusiveUseArea();
			deduplicated.putIfAbsent(dedupKey, transaction);
		}

		List<RentalApartmentSearchResponse> results = deduplicated.values().stream()
				.map(RentalApartmentSearchResponse::from).collect(Collectors.toList());

		int start = Math.min((int) pageable.getOffset(), results.size());
		int end = Math.min(start + pageable.getPageSize(), results.size());
		return new PageImpl<>(results.subList(start, end), pageable, results.size());
	}

	private String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value;
	}
}
