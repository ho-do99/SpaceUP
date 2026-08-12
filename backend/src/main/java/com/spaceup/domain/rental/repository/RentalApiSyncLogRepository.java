package com.spaceup.domain.rental.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.spaceup.domain.rental.entity.RentalApiSyncLog;

public interface RentalApiSyncLogRepository extends JpaRepository<RentalApiSyncLog, Long> {
}
