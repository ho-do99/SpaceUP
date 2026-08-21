package com.spaceup.domain.visit.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.chat.service.ChatService;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.visit.entity.SiteVisit;
import com.spaceup.domain.visit.repository.SiteVisitRepository;

@ExtendWith(MockitoExtension.class)
class SiteVisitMultiContractorTest {

	@Mock SiteVisitRepository siteVisitRepository;
	@Mock QuoteRequestRepository quoteRequestRepository;
	@Mock NotificationService notificationService;
	@Mock ChatService chatService;
	@InjectMocks SiteVisitService service;

	@Test
	void landlordMustChooseContractorWhenMultipleVisitThreadsExist() {
		Member owner = Member.builder().id(10L).build();
		Member first = Member.builder().id(20L).build();
		Member second = Member.builder().id(30L).build();
		Property property = Property.builder().owner(owner).region("광주").build();
		QuoteRequest request = QuoteRequest.builder().id(1L).owner(owner).property(property).build();
		SiteVisit firstVisit = SiteVisit.builder().id(100L).request(request).contractor(first).build();
		SiteVisit secondVisit = SiteVisit.builder().id(200L).request(request).contractor(second).build();

		when(quoteRequestRepository.findById(1L)).thenReturn(Optional.of(request));
		when(siteVisitRepository.findByRequestId(1L)).thenReturn(List.of(firstVisit, secondVisit));

		assertThrows(IllegalArgumentException.class, () -> service.getByRequest(1L, null, 10L));

		when(siteVisitRepository.findByRequestIdAndContractorId(1L, 20L)).thenReturn(Optional.of(firstVisit));
		assertEquals(100L, service.getByRequest(1L, 20L, 10L).id());
	}
}
