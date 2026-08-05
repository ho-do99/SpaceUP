package com.spaceup.domain.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.project.entity.ProjectChecklistItem;

@Repository
public interface ProjectChecklistItemRepository extends JpaRepository<ProjectChecklistItem, Long> {
}
