package com.spaceup.domain.project.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.contractor.service.ContractorProfileService;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.project.dto.ProjectChecklistItemResponse;
import com.spaceup.domain.project.dto.ProjectResponse;
import com.spaceup.domain.project.dto.ProjectScheduleChangeResponse;
import com.spaceup.domain.project.entity.ContractorProject;
import com.spaceup.domain.project.entity.ProjectChecklistItem;
import com.spaceup.domain.project.entity.ProjectStatus;
import com.spaceup.domain.project.repository.ContractorProjectRepository;
import com.spaceup.domain.project.repository.ProjectChecklistItemRepository;
import com.spaceup.domain.quote.entity.ContractorQuote;
import com.spaceup.domain.quote.entity.QuoteStatus;
import com.spaceup.domain.quote.repository.ContractorQuoteRepository;
import com.spaceup.domain.visit.entity.SiteVisitStatus;
import com.spaceup.domain.visit.repository.SiteVisitRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.InvalidStatusTransitionException;
import com.spaceup.global.error.ProjectNotFoundException;
import com.spaceup.global.error.QuoteNotFoundException;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "공사 진행률" 화면. 수락된 견적(ContractorQuote.ACCEPTED)을 시공사가 "계약 전환"하면
// 이 도메인의 레코드가 생성됩니다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

	private final ContractorProjectRepository contractorProjectRepository;
	private final ProjectChecklistItemRepository projectChecklistItemRepository;
	private final ContractorQuoteRepository contractorQuoteRepository;
	private final SiteVisitRepository siteVisitRepository;
	private final NotificationService notificationService;
	private final ContractorProfileService contractorProfileService;

	// ⭐ PDF "계약 전환" - 수락된 견적 1건당 프로젝트 1건. 이미 전환되었으면 다시 만들지 않고 막습니다(중복 전환 방지)
	@Transactional
	public ProjectResponse convert(Long quoteId, Long contractorId, String constructionItemsOverride) {
		ContractorQuote quote = contractorQuoteRepository.findById(quoteId)
				.orElseThrow(() -> new QuoteNotFoundException("존재하지 않는 견적입니다: " + quoteId));
		if (!quote.getContractor().getId().equals(contractorId)) {
			throw new ForbiddenAccessException("본인이 작성한 견적만 계약 전환할 수 있습니다.");
		}
		if (quote.getStatus() != QuoteStatus.ACCEPTED) {
			throw new InvalidStatusTransitionException("수락된(ACCEPTED) 견적만 계약 전환할 수 있습니다.");
		}
		if (quote.getRequest().getContractor() == null
				|| !quote.getRequest().getContractor().getId().equals(contractorId)) {
			throw new InvalidStatusTransitionException("최종 선택된 시공사만 계약 전환할 수 있습니다.");
		}
		if (contractorProjectRepository.existsByRequestId(quote.getRequest().getId())) {
			throw new InvalidStatusTransitionException("이미 계약 전환된 의뢰입니다.");
		}

		boolean visitCompleted = siteVisitRepository
				.findByRequestIdAndContractorId(quote.getRequest().getId(), contractorId)
				.map(visit -> visit.getStatus() == SiteVisitStatus.COMPLETED).orElse(false);

		String constructionItems = constructionItemsOverride != null && !constructionItemsOverride.isBlank()
				? constructionItemsOverride
				: quote.getItems().stream().map(item -> item.getCategory()).distinct()
						.collect(Collectors.joining(","));

		ContractorProject project = ContractorProject.builder().request(quote.getRequest()).quote(quote)
				.status(visitCompleted ? ProjectStatus.START_SCHEDULED : ProjectStatus.VISIT_SCHEDULED)
				.contractDate(LocalDate.now()).contractAmount(quote.getTotalAmount())
				.constructionItems(constructionItems).customerRequest(quote.getRequest().getRequestedItems())
				.build();
		contractorProjectRepository.save(project);

		notificationService.notifyForRequest(quote.getRequest().getOwner().getId(), NotificationType.PROJECT,
				"공사 계약이 체결되었습니다",
				String.format("%s · %s 계약이 체결되었습니다. 공사 진행 현황을 확인해 주세요.",
						quote.getRequest().getRequestCode(), quote.getTitle()),
				quote.getRequest().getId(), quote.getContractor().getId());
		return new ProjectResponse(project);
	}

	// ⭐ [보안 수정] 해당 프로젝트의 임대인 본인 또는 배정된 시공사만 조회 가능
	public ProjectResponse getProject(Long projectId, Long memberId) {
		ContractorProject project = findOrThrow(projectId);
		boolean isOwner = project.getRequest().getOwner().getId().equals(memberId);
		boolean isContractor = project.getRequest().getContractor() != null
				&& project.getRequest().getContractor().getId().equals(memberId);
		if (!isOwner && !isContractor) {
			throw new ForbiddenAccessException("본인이 참여 중인 프로젝트만 조회할 수 있습니다.");
		}
		return new ProjectResponse(project);
	}

	public Page<ProjectResponse> getProjectsByContractor(Long contractorId, Pageable pageable) {
		return contractorProjectRepository.findByRequestContractorId(contractorId, pageable).map(ProjectResponse::new);
	}

	public List<ProjectResponse> getProjectsByLandlord(Long landlordId) {
		return contractorProjectRepository.findByRequestOwnerId(landlordId).stream().map(ProjectResponse::new).toList();
	}

	// ⭐ [Figma 반영] "일정 변경" - 이전 값을 응답에 함께 실어 프론트가 바로 안내 문구를 만들 수 있게 합니다.
	@Transactional
	public ProjectScheduleChangeResponse updateSchedule(Long projectId, Long contractorId, LocalDate startDate,
			LocalDate completionDate, String reason) {
		ContractorProject project = findOrThrow(projectId);
		validateContractor(project, contractorId);
		if (completionDate.isBefore(startDate)) {
			throw new IllegalArgumentException("완공 예정일은 착공일보다 빠를 수 없습니다.");
		}

		LocalDate previousStartDate = project.getStartDate();
		LocalDate previousCompletionDate = project.getCompletionDate();
		project.updateSchedule(startDate, completionDate);

		notificationService.notifyForRequest(project.getRequest().getOwner().getId(), NotificationType.PROJECT,
				"공사 일정이 변경되었습니다",
				String.format("%s · 착공일 %s, 완공 예정일 %s로 변경되었습니다. 사유: %s",
						project.getRequest().getRequestCode(), startDate, completionDate, reason),
				project.getRequest().getId(), project.getRequest().getContractor().getId());
		return new ProjectScheduleChangeResponse(previousStartDate, previousCompletionDate, startDate, completionDate,
				reason);
	}

	@Transactional
	public ProjectResponse start(Long projectId, Long contractorId) {
		ContractorProject project = findOrThrow(projectId);
		validateContractor(project, contractorId);
		project.start();
		project.getRequest().startProgress();

		notificationService.notifyForRequest(project.getRequest().getOwner().getId(), NotificationType.PROJECT,
				"공사가 시작되었습니다",
				String.format("%s · 공사가 착공되어 시공이 진행 중입니다.", project.getRequest().getRequestCode()),
				project.getRequest().getId(), project.getRequest().getContractor().getId());
		return new ProjectResponse(project);
	}

	@Transactional
	public ProjectResponse requestCompletion(Long projectId, Long contractorId) {
		ContractorProject project = findOrThrow(projectId);
		validateContractor(project, contractorId);
		project.requestCompletion();

		notificationService.notifyForRequest(project.getRequest().getOwner().getId(), NotificationType.PROJECT,
				"공사 완료 확인이 필요합니다",
				String.format("%s · 시공사가 공사 완료를 요청했습니다. 확인 후 완료 처리해 주세요.",
						project.getRequest().getRequestCode()),
				project.getRequest().getId(), project.getRequest().getContractor().getId());
		return new ProjectResponse(project);
	}

	// ⭐ 임대인(고객)이 완료를 최종 확인 - 이 시점에 시공사 완료 실적을 누적합니다.
	@Transactional
	public ProjectResponse confirmCompletion(Long projectId, Long landlordId) {
		ContractorProject project = findOrThrow(projectId);
		if (!project.getRequest().getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰의 프로젝트만 완료 확인할 수 있습니다.");
		}
		project.confirmCompletion();
		project.getRequest().complete();
		contractorProfileService.increaseCompletedProject(project.getRequest().getContractor().getId());

		notificationService.notifyForRequest(project.getRequest().getContractor().getId(), NotificationType.PROJECT,
				"공사 완료가 확인되었습니다",
				String.format("%s · 임대인이 공사 완료를 확인했습니다.", project.getRequest().getRequestCode()),
				project.getRequest().getId(), project.getRequest().getContractor().getId());
		return new ProjectResponse(project);
	}

	@Transactional
	public ProjectChecklistItemResponse addChecklistItem(Long projectId, Long contractorId, String label) {
		ContractorProject project = findOrThrow(projectId);
		validateContractor(project, contractorId);
		ProjectChecklistItem item = ProjectChecklistItem.builder().label(label).sortOrder(project.getChecklist().size())
				.build();
		project.addChecklistItem(item);
		projectChecklistItemRepository.save(item);
		return new ProjectChecklistItemResponse(item);
	}

	@Transactional
	public ProjectChecklistItemResponse toggleChecklistItem(Long projectId, Long itemId, Long contractorId,
			boolean completed) {
		ContractorProject project = findOrThrow(projectId);
		validateContractor(project, contractorId);
		ProjectChecklistItem item = project.getChecklist().stream().filter(i -> i.getId().equals(itemId)).findFirst()
				.orElseThrow(() -> new ProjectNotFoundException("존재하지 않는 체크리스트 항목입니다: " + itemId));
		item.setCompleted(completed);
		return new ProjectChecklistItemResponse(item);
	}

	private void validateContractor(ContractorProject project, Long contractorId) {
		if (!project.getRequest().getContractor().getId().equals(contractorId)) {
			throw new ForbiddenAccessException("본인의 프로젝트만 처리할 수 있습니다.");
		}
	}

	private ContractorProject findOrThrow(Long projectId) {
		return contractorProjectRepository.findById(projectId)
				.orElseThrow(() -> new ProjectNotFoundException("존재하지 않는 프로젝트입니다: " + projectId));
	}
}
