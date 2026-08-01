package com.spaceup.domain.request.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.request.entity.Property;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {
}
