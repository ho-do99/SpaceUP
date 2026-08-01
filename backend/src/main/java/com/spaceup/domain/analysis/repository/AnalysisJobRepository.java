package com.spaceup.domain.analysis.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.analysis.entity.AnalysisJob;

@Repository
public interface AnalysisJobRepository extends JpaRepository<AnalysisJob, Long> {

	Optional<AnalysisJob> findByRequestId(Long requestId);
}
