package com.spaceup.domain.visit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestContractor;
import com.spaceup.domain.request.entity.RequestContractorStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.domain.visit.entity.SiteVisit;
import com.spaceup.domain.visit.entity.SiteVisitStatus;
import com.spaceup.domain.visit.repository.SiteVisitRepository;

@ExtendWith(MockitoExtension.class)
class SiteVisitServiceLiveFlowTest {
	@Mock SiteVisitRepository siteVisitRepository;
	@Mock QuoteRequestRepository quoteRequestRepository;
	@Mock RequestContractorRepository requestContractorRepository;
	@Mock NotificationService notificationService;
	@InjectMocks SiteVisitService service;

	@Test
	void approvedLegacyRequestLazilyCreatesItsMissingVisitRoom() {
		Member owner = Member.builder().id(1L).build();
		Member contractor = Member.builder().id(2L).build();
		QuoteRequest request = QuoteRequest.builder().id(10L).owner(owner)
				.property(Property.builder().owner(owner).region("광주 서구").build()).build();
		RequestContractor participation = RequestContractor.builder().request(request).contractor(contractor)
				.status(RequestContractorStatus.APPROVED).build();
		when(quoteRequestRepository.findById(10L)).thenReturn(Optional.of(request));
		when(requestContractorRepository.findByRequestIdAndContractorId(10L, 2L)).thenReturn(Optional.of(participation));
		when(siteVisitRepository.findByRequestIdAndContractorId(10L, 2L)).thenReturn(Optional.empty());
		when(siteVisitRepository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(invocation -> invocation.getArgument(0));

		assertThat(service.getByRequest(10L, 2L, 1L).status()).isEqualTo(SiteVisitStatus.UNSCHEDULED);
	}

	@Test
	void landlordCanRequestTheFirstScheduleFromAnUnscheduledVisit() {
		Member owner = Member.builder().id(1L).build();
		Member contractor = Member.builder().id(2L).build();
		QuoteRequest request = QuoteRequest.builder().id(10L).owner(owner)
				.property(Property.builder().owner(owner).region("광주 서구").build()).build();
		SiteVisit visit = SiteVisit.builder().id(30L).request(request).contractor(contractor).build();
		when(siteVisitRepository.findById(30L)).thenReturn(Optional.of(visit));

		service.requestChange(30L, 1L, LocalDate.of(2026, 9, 8), LocalTime.of(14, 0), "오후 방문 희망");

		assertThat(visit.getStatus()).isEqualTo(SiteVisitStatus.CHANGE_REQUESTED);
		assertThat(visit.getRequestedDate()).isEqualTo(LocalDate.of(2026, 9, 8));
		verify(notificationService).notify(eq(2L), eq(NotificationType.VISIT),
				eq("방문 일정 변경 요청이 도착했습니다"),
				eq("희망 일정: 2026-09-08 14:00 (오후 방문 희망)"));
	}
}
