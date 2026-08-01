package com.spaceup.domain.rental.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.rental.entity.RentalTransaction;
import com.spaceup.domain.rental.repository.RentalTransactionRepository;

@Service
public class RentalTransactionWriter {

	private final RentalTransactionRepository repository;

	public RentalTransactionWriter(RentalTransactionRepository repository) {
		this.repository = repository;
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public InsertResult insertIfAbsent(RentalTransaction transaction) {
		if (repository.existsBySourceKey(transaction.getSourceKey())) {
			return InsertResult.DUPLICATE;
		}
		repository.saveAndFlush(transaction);
		return InsertResult.INSERTED;
	}
}
