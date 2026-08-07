package com.spaceup.domain.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.contractor.service.ContractorProfileService;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.project.entity.ContractorProject;
import com.spaceup.domain.project.entity.ProjectStatus;
import com.spaceup.domain.project.repository.ContractorProjectRepository;
import com.spaceup.domain.project.repository.ProjectChecklistItemRepository;
import com.spaceup.domain.quote.entity.ContractorQuote;
import com.spaceup.domain.quote.entity.QuoteStatus;
import com.spaceup.domain.quote.repository.ContractorQuoteRepository;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.visit.entity.SiteVisit;
import com.spaceup.domain.visit.entity.SiteVisitStatus;
import com.spaceup.domain.visit.repository.SiteVisitRepository;

@ExtendWith(MockitoExtension.class)
class ProjectServiceLifecycleTest {

	@Mock ContractorProjectRepository contractorProjectRepository;
	@Mock ProjectChecklistItemRepository projectChecklistItemRepository;
	@Mock ContractorQuoteRepository contractorQuoteRepository;
	@Mock SiteVisitRepository siteVisitRepository;
	@Mock NotificationService notificationService;
	@Mock ContractorProfileService contractorProfileService;
	@InjectMocks ProjectService service;

	@Test
	void acceptedQuoteWithCompletedVisitRunsThroughLandlordConfirmedCompletion() {
		Member owner = Member.builder().id(10L).name("owner").build();
		Member contractor = Member.builder().id(20L).name("contractor").build();
		Property property = Property.builder().owner(owner).region("광주").build();
		QuoteRequest request = QuoteRequest.builder().id(1L).requestCode("REQ-1").owner(owner)
				.property(property).contractor(contractor).status(RequestStatus.APPROVED).build();
		ContractorQuote quote = ContractorQuote.builder().id(100L).request(request).contractor(contractor)
				.title("선택 견적").totalAmount(5_000_000L).status(QuoteStatus.ACCEPTED).build();
		SiteVisit visit = SiteVisit.builder().id(200L).request(request).contractor(contractor)
				.status(SiteVisitStatus.COMPLETED).build();

		when(contractorQuoteRepository.findById(100L)).thenReturn(Optional.of(quote));
		when(contractorProjectRepository.existsByRequestId(1L)).thenReturn(false);
		when(siteVisitRepository.findByRequestIdAndContractorId(1L, 20L)).thenReturn(Optional.of(visit));

		var converted = service.convert(100L, 20L, null);
		assertEquals(ProjectStatus.START_SCHEDULED, converted.status());

		ContractorProject project = ContractorProject.builder().id(300L).request(request).quote(quote)
				.status(ProjectStatus.START_SCHEDULED).build();
		when(contractorProjectRepository.findById(300L)).thenReturn(Optional.of(project));

		service.start(300L, 20L);
		assertEquals(ProjectStatus.IN_PROGRESS, project.getStatus());
		assertEquals(RequestStatus.IN_PROGRESS, request.getStatus());

		service.requestCompletion(300L, 20L);
		assertEquals(ProjectStatus.COMPLETION_REQUESTED, project.getStatus());

		service.confirmCompletion(300L, 10L);
		assertEquals(ProjectStatus.COMPLETED, project.getStatus());
		assertEquals(RequestStatus.COMPLETED, request.getStatus());
		verify(contractorProfileService).increaseCompletedProject(20L);
	}
}
