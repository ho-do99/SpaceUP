package com.spaceup.domain.visit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.visit.entity.SiteVisit;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisit, Long> {

	Optional<SiteVisit> findByRequestId(Long requestId);

	boolean existsByRequestId(Long requestId);
}
