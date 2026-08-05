package com.spaceup.domain.project.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.project.dto.ChecklistItemAddRequest;
import com.spaceup.domain.project.dto.ChecklistItemToggleRequest;
import com.spaceup.domain.project.dto.ProjectChecklistItemResponse;
import com.spaceup.domain.project.dto.ProjectConvertRequest;
import com.spaceup.domain.project.dto.ProjectResponse;
import com.spaceup.domain.project.dto.ProjectScheduleChangeResponse;
import com.spaceup.domain.project.dto.ProjectScheduleUpdateRequest;
import com.spaceup.domain.project.service.ProjectService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "공사 진행률" 화면(ContractorProject)
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

	private final ProjectService projectService;

	// ⭐ PDF "계약 전환" 버튼 - 수락된 견적 → 프로젝트로 전환
	@PostMapping
	public ResponseEntity<ApiResponse<ProjectResponse>> convert(@Valid @RequestBody ProjectConvertRequest request,
			Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("계약이 전환되었습니다.",
				projectService.convert(request.getQuoteId(), getMemberId(authentication), request.getConstructionItems())));
	}

	@GetMapping("/{projectId}")
	public ResponseEntity<ApiResponse<ProjectResponse>> getProject(@PathVariable Long projectId) {
		return ResponseEntity.ok(ApiResponse.success("프로젝트 조회 완료", projectService.getProject(projectId)));
	}

	@GetMapping("/contractor/me")
	public ResponseEntity<ApiResponse<Page<ProjectResponse>>> getMyProjectsAsContractor(
			@PageableDefault(size = 20) Pageable pageable, Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("프로젝트 목록 조회 완료",
				projectService.getProjectsByContractor(getMemberId(authentication), pageable)));
	}

	@GetMapping("/landlord/me")
	public ResponseEntity<ApiResponse<List<ProjectResponse>>> getMyProjectsAsLandlord(Authentication authentication) {
		return ResponseEntity
				.ok(ApiResponse.success("프로젝트 목록 조회 완료", projectService.getProjectsByLandlord(getMemberId(authentication))));
	}

	@PatchMapping("/{projectId}/schedule")
	public ResponseEntity<ApiResponse<ProjectScheduleChangeResponse>> updateSchedule(@PathVariable Long projectId,
			@Valid @RequestBody ProjectScheduleUpdateRequest request, Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("공사 일정이 변경되었습니다.", projectService.updateSchedule(projectId,
				getMemberId(authentication), request.getStartDate(), request.getCompletionDate(), request.getReason())));
	}

	@PostMapping("/{projectId}/start")
	public ResponseEntity<ApiResponse<ProjectResponse>> start(@PathVariable Long projectId,
			Authentication authentication) {
		return ResponseEntity
				.ok(ApiResponse.success("공사를 시작합니다.", projectService.start(projectId, getMemberId(authentication))));
	}

	@PostMapping("/{projectId}/request-completion")
	public ResponseEntity<ApiResponse<ProjectResponse>> requestCompletion(@PathVariable Long projectId,
			Authentication authentication) {
		return ResponseEntity.ok(
				ApiResponse.success("완료 확인을 요청했습니다.", projectService.requestCompletion(projectId, getMemberId(authentication))));
	}

	@PostMapping("/{projectId}/confirm-completion")
	public ResponseEntity<ApiResponse<ProjectResponse>> confirmCompletion(@PathVariable Long projectId,
			Authentication authentication) {
		return ResponseEntity.ok(
				ApiResponse.success("공사 완료를 확인했습니다.", projectService.confirmCompletion(projectId, getMemberId(authentication))));
	}

	@PostMapping("/{projectId}/checklist")
	public ResponseEntity<ApiResponse<ProjectChecklistItemResponse>> addChecklistItem(@PathVariable Long projectId,
			@Valid @RequestBody ChecklistItemAddRequest request, Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("체크리스트 항목이 추가되었습니다.",
				projectService.addChecklistItem(projectId, getMemberId(authentication), request.getLabel())));
	}

	@PatchMapping("/{projectId}/checklist/{itemId}")
	public ResponseEntity<ApiResponse<ProjectChecklistItemResponse>> toggleChecklistItem(@PathVariable Long projectId,
			@PathVariable Long itemId, @RequestBody ChecklistItemToggleRequest request,
			Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("체크리스트가 갱신되었습니다.", projectService.toggleChecklistItem(projectId,
				itemId, getMemberId(authentication), request.isCompleted())));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
