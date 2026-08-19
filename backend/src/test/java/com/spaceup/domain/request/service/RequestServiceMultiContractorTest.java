package com.spaceup.domain.request.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.analysis.repository.AnalysisJobRepository;
import com.spaceup.domain.analysis.service.AnalysisJobService;
import com.spaceup.domain.contractor.repository.ContractorProfileRepository;
import com.spaceup.domain.floorplan.repository.FloorPlanVariantRepository;
import com.spaceup.domain.matching.service.MatchingScoreCalculator;
import com.spaceup.domain.material.repository.MaterialProductRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.quote.repository.ContractorQuoteRepository;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestContractor;
import com.spaceup.domain.request.entity.RequestContractorStatus;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.PropertyRepository;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.domain.visit.service.SiteVisitService;

@ExtendWith(MockitoExtension.class)
class RequestServiceMultiContractorTest {

	@Mock private QuoteRequestRepository quoteRequestRepository;
	@Mock private RequestContractorRepository requestContractorRepository;
	@Mock private PropertyRepository propertyRepository;
	@Mock private MemberRepository memberRepository;
	@Mock private MatchingScoreCalculator matchingScoreCalculator;
	@Mock private ContractorProfileRepository contractorProfileRepository;
	@Mock private FloorPlanVariantRepository floorPlanVariantRepository;
	@Mock private AnalysisJobService analysisJobService;
	@Mock private AnalysisJobRepository analysisJobRepository;
	@Mock private ContractorQuoteRepository contractorQuoteRepository;
	@Mock private NotificationService notificationService;
	@Mock private SiteVisitService siteVisitService;
	@Mock private MaterialProductRepository materialProductRepository;

	private RequestService service;
	private QuoteRequest request;

	@BeforeEach
	void setUp() {
		service = new RequestService(quoteRequestRepository, requestContractorRepository, propertyRepository,
				memberRepository, matchingScoreCalculator, contractorProfileRepository, floorPlanVariantRepository,
				analysisJobService, analysisJobRepository, contractorQuoteRepository, notificationService,
				siteVisitService, materialProductRepository);
		Member landlord = Member.builder().id(10L).build();
		request = QuoteRequest.builder().id(1L).owner(landlord)
				.property(Property.builder().owner(landlord).region("광주 북구").build())
				.requestCode("REQ-TEST-000001").status(RequestStatus.REVIEWING)
				.lastActivityAt(LocalDateTime.of(2026, 8, 19, 9, 0)).build();
	}

	@Test
	void repeatedApprovalDoesNotNotifyOrTouchTheRequestAgain() {
		RequestContractor participation = approvedParticipation();
		RequestStatus statusBefore = request.getStatus();
		LocalDateTime activityBefore = request.getLastActivityAt();
		when(quoteRequestRepository.findById(1L)).thenReturn(Optional.of(request));
		when(requestContractorRepository.findByRequestIdAndContractorId(1L, 20L))
				.thenReturn(Optional.of(participation));

		service.approve(1L, 20L);

		verify(notificationService, never()).notify(any(), any(), any(), any());
		assertEquals(statusBefore, request.getStatus());
		assertEquals(activityBefore, request.getLastActivityAt());
	}

	@Test
	void selectedParticipationApprovalDoesNotMutateOrCauseRequestSideEffects() {
		RequestContractor participation = selectedParticipation();
		RequestStatus statusBefore = request.getStatus();
		LocalDateTime activityBefore = request.getLastActivityAt();

		assertFalse(participation.approve());
		assertEquals(RequestContractorStatus.SELECTED, participation.getStatus());
		when(quoteRequestRepository.findById(1L)).thenReturn(Optional.of(request));
		when(requestContractorRepository.findByRequestIdAndContractorId(1L, 20L))
				.thenReturn(Optional.of(participation));

		service.approve(1L, 20L);

		verify(notificationService, never()).notify(any(), any(), any(), any());
		assertEquals(statusBefore, request.getStatus());
		assertEquals(activityBefore, request.getLastActivityAt());
	}

	private RequestContractor selectedParticipation() {
		return RequestContractor.builder().request(request).contractor(Member.builder().id(20L).build())
				.status(RequestContractorStatus.SELECTED).build();
	}
	private RequestContractor approvedParticipation() {
		return RequestContractor.builder().request(request).contractor(Member.builder().id(20L).build())
				.status(RequestContractorStatus.APPROVED).build();
	}
}
