package com.spaceup.domain.project.dto;

import java.time.LocalDate;
import java.util.List;

import com.spaceup.domain.project.entity.ContractorProject;
import com.spaceup.domain.project.entity.ProjectStatus;

public record ProjectResponse(
		Long id,
		Long requestId,
		Long quoteId,
		String requestCode,
		String customerName,
		Long contractorId,
		String contractorName,
		String address,
		ProjectStatus status,
		LocalDate contractDate,
		Long contractAmount,
		LocalDate startDate,
		LocalDate completionDate,
		String constructionItems,
		String customerRequest,
		List<ProjectChecklistItemResponse> checklist) {

	public ProjectResponse(ContractorProject project) {
		this(project.getId(), project.getRequest().getId(), project.getQuote().getId(),
				project.getRequest().getRequestCode(), project.getRequest().getOwner().getName(),
				project.getRequest().getContractor().getId(), project.getRequest().getContractor().getName(),
				project.getRequest().getProperty().getRegion(),
				project.getStatus(), project.getContractDate(), project.getContractAmount(), project.getStartDate(),
				project.getCompletionDate(), project.getConstructionItems(), project.getCustomerRequest(),
				project.getChecklist().stream().map(ProjectChecklistItemResponse::new).toList());
	}
}
