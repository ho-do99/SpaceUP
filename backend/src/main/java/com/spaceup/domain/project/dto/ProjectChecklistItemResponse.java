package com.spaceup.domain.project.dto;

import com.spaceup.domain.project.entity.ProjectChecklistItem;

public record ProjectChecklistItemResponse(Long id, String label, boolean completed) {
	public ProjectChecklistItemResponse(ProjectChecklistItem item) {
		this(item.getId(), item.getLabel(), item.isCompleted());
	}
}
