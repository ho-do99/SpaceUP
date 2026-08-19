package com.spaceup.domain.request.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.spaceup.domain.request.entity.RequestContractor;
import com.spaceup.domain.request.entity.RequestContractorStatus;

public interface RequestContractorRepository extends JpaRepository<RequestContractor, Long> {

	Optional<RequestContractor> findByRequestIdAndContractorId(Long requestId, Long contractorId);

	boolean existsByRequestIdAndContractorId(Long requestId, Long contractorId);

	Page<RequestContractor> findByContractorId(Long contractorId, Pageable pageable);

	List<RequestContractor> findByContractorId(Long contractorId);

	List<RequestContractor> findByRequestId(Long requestId);

	List<RequestContractor> findByRequestIdAndStatusIn(Long requestId, List<RequestContractorStatus> statuses);

	long countByContractorIdAndStatus(Long contractorId, RequestContractorStatus status);
}
