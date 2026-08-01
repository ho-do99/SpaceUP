package com.spaceup.domain.rental.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.spaceup.domain.rental.entity.RentalTransaction;

public interface RentalTransactionRepository extends JpaRepository<RentalTransaction, Long> {

	boolean existsBySourceKey(String sourceKey);

	Page<RentalTransaction> findBySggCodeAndDealYearAndDealMonth(
			String sggCode,
			Integer dealYear,
			Integer dealMonth,
			Pageable pageable);
}
