package com.spaceup.domain.rental.service;

import java.time.YearMonth;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.rental.dto.RentalTransactionResponse;
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
}
