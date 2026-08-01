package com.spaceup.domain.schedule.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.contractor.service.ContractorProfileService;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.schedule.dto.ScheduleCreateRequest;
import com.spaceup.domain.schedule.dto.ScheduleResponse;
import com.spaceup.domain.schedule.entity.ScheduleEvent;
import com.spaceup.domain.schedule.entity.ScheduleStatus;
import com.spaceup.domain.schedule.repository.ScheduleEventRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.RequestNotFoundException;
import com.spaceup.global.error.ScheduleNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScheduleService {

	private final ScheduleEventRepository scheduleEventRepository;
	private final QuoteRequestRepository quoteRequestRepository;
	private final MemberRepository memberRepository;
	private final NotificationService notificationService;
	private final ContractorProfileService contractorProfileService;

	// ⭐ PDF "일정관리" 화면 - 견적이 확정(Quote.accept())된 이후 시공사가 착공 일정을 등록하는 시점. 임대인에게 확정
	// 알림을 보냅니다.
	@Transactional
	public Long createSchedule(Long contractorId, ScheduleCreateRequest dto) {
		Member contractor = memberRepository.findById(contractorId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + contractorId));
		QuoteRequest request = quoteRequestRepository.findById(dto.getRequestId())
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + dto.getRequestId()));

		ScheduleEvent event = ScheduleEvent.builder().contractor(contractor).request(request).title(dto.getTitle())
				.scheduledAt(dto.getScheduledAt()).status(ScheduleStatus.SCHEDULED).build();

		scheduleEventRepository.save(event);

		notificationService.notify(request.getOwner().getId(), NotificationType.SCHEDULE, "시공 일정이 확정되었습니다",
				String.format("%s 일정이 %s로 확정되었습니다.", dto.getTitle(), dto.getScheduledAt()));

		return event.getId();
	}

	// ⭐ PDF "일정관리" 화면의 월간/목록 뷰 (시공사 로그인 기준 - 본인 일정 전체, 페이지네이션)
	public Page<ScheduleResponse> getSchedulesByContractor(Long contractorId, Pageable pageable) {
		return scheduleEventRepository.findByContractorId(contractorId, pageable).map(ScheduleResponse::new);
	}

	@Transactional
	public void reschedule(Long scheduleId, Long contractorId, LocalDateTime newTime) {
		ScheduleEvent event = findScheduleOrThrow(scheduleId);
		validateOwnership(event, contractorId);
		event.reschedule(newTime);

		notificationService.notify(event.getRequest().getOwner().getId(), NotificationType.SCHEDULE,
				"시공 일정이 변경되었습니다", String.format("%s 일정이 %s로 변경되었습니다.", event.getTitle(), newTime));
	}

	@Transactional
	public void start(Long scheduleId, Long contractorId) {
		ScheduleEvent event = findScheduleOrThrow(scheduleId);
		validateOwnership(event, contractorId);
		event.start();
	}

	// ⭐ 시공 완료 시 시공사 프로필의 완료 실적을 같이 누적합니다 (ContractorProfile.increaseCompletedProject).
	@Transactional
	public void complete(Long scheduleId, Long contractorId) {
		ScheduleEvent event = findScheduleOrThrow(scheduleId);
		validateOwnership(event, contractorId);
		event.complete();
		contractorProfileService.increaseCompletedProject(event.getContractor().getId());

		notificationService.notify(event.getRequest().getOwner().getId(), NotificationType.SCHEDULE,
				"시공이 완료되었습니다", String.format("%s 시공이 완료되었습니다.", event.getTitle()));
	}

	private void validateOwnership(ScheduleEvent event, Long contractorId) {
		if (!event.getContractor().getId().equals(contractorId)) {
			throw new ForbiddenAccessException("본인이 등록한 일정만 처리할 수 있습니다.");
		}
	}

	private ScheduleEvent findScheduleOrThrow(Long scheduleId) {
		return scheduleEventRepository.findById(scheduleId)
				.orElseThrow(() -> new ScheduleNotFoundException("존재하지 않는 일정입니다: " + scheduleId));
	}
}
