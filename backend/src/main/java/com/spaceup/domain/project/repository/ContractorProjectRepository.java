package com.spaceup.domain.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.project.entity.ContractorProject;

@Repository
public interface ContractorProjectRepository extends JpaRepository<ContractorProject, Long> {

	Optional<ContractorProject> findByRequestId(Long requestId);

	boolean existsByRequestId(Long requestId);

	Page<ContractorProject> findByRequestContractorId(Long contractorId, Pageable pageable);

	List<ContractorProject> findByRequestOwnerId(Long ownerId);
}
