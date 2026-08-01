package com.spaceup.domain.schedule.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.schedule.entity.ScheduleEvent;

@Repository
public interface ScheduleEventRepository extends JpaRepository<ScheduleEvent, Long> {

	Page<ScheduleEvent> findByContractorId(Long contractorId, Pageable pageable);
}
