package com.spaceup.domain.visit.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.visit.entity.SiteVisit;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisit, Long> {

	Optional<SiteVisit> findByRequestIdAndContractorId(Long requestId, Long contractorId);

	boolean existsByRequestIdAndContractorId(Long requestId, Long contractorId);

	List<SiteVisit> findByRequestId(Long requestId);
}
