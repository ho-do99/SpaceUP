package com.spaceup.domain.analysis.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.analysis.entity.AnalysisSpace;

@Repository
public interface AnalysisSpaceRepository extends JpaRepository<AnalysisSpace, Long> {

	List<AnalysisSpace> findByAnalysisJobIdOrderBySortOrderAsc(Long analysisJobId);

	void deleteByAnalysisJobId(Long analysisJobId);
}
