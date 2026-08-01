package com.spaceup.domain.schedule.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.schedule.dto.ScheduleCreateRequest;
import com.spaceup.domain.schedule.dto.ScheduleRescheduleRequest;
import com.spaceup.domain.schedule.dto.ScheduleResponse;
import com.spaceup.domain.schedule.service.ScheduleService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

	private final ScheduleService scheduleService;

	// ⭐ PDF "일정관리" 화면 - 시공사가 착공 일정을 등록 (시공사 로그인 기준)
	@PostMapping
	public ResponseEntity<ApiResponse<Long>> create(@Valid @RequestBody ScheduleCreateRequest request,
			Authentication authentication) {
		Long contractorId = getMemberId(authentication);
		Long scheduleId = scheduleService.createSchedule(contractorId, request);
		return ResponseEntity.ok(ApiResponse.success("일정이 등록되었습니다.", scheduleId));
	}

	// ⭐ PDF "일정관리" 화면의 월간/목록 뷰 (페이지네이션)
	@GetMapping("/me")
	public ResponseEntity<ApiResponse<Page<ScheduleResponse>>> getMySchedules(@PageableDefault(size = 20) Pageable pageable,
			Authentication authentication) {
		Long contractorId = getMemberId(authentication);
		return ResponseEntity.ok(ApiResponse.success("일정 조회 완료", scheduleService.getSchedulesByContractor(contractorId, pageable)));
	}

	@PatchMapping("/{scheduleId}")
	public ResponseEntity<ApiResponse<Void>> reschedule(@PathVariable Long scheduleId,
			@Valid @RequestBody ScheduleRescheduleRequest request, Authentication authentication) {
		scheduleService.reschedule(scheduleId, getMemberId(authentication), request.getScheduledAt());
		return ResponseEntity.ok(ApiResponse.success("일정이 변경되었습니다.", null));
	}

	@PostMapping("/{scheduleId}/start")
	public ResponseEntity<ApiResponse<Void>> start(@PathVariable Long scheduleId, Authentication authentication) {
		scheduleService.start(scheduleId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("시공을 시작합니다.", null));
	}

	@PostMapping("/{scheduleId}/complete")
	public ResponseEntity<ApiResponse<Void>> complete(@PathVariable Long scheduleId, Authentication authentication) {
		scheduleService.complete(scheduleId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("시공이 완료되었습니다.", null));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
