package com.spaceup.domain.quote.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.analysis.repository.AnalysisJobRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.quote.dto.ContractorQuoteCreateRequest;
import com.spaceup.domain.quote.dto.ContractorQuoteItemRequest;
import com.spaceup.domain.quote.entity.ContractorQuote;
import com.spaceup.domain.quote.entity.QuotePhase;
import com.spaceup.domain.quote.entity.QuoteStatus;
import com.spaceup.domain.quote.repository.ContractorQuoteRepository;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestContractor;
import com.spaceup.domain.request.entity.RequestContractorStatus;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.domain.visit.entity.SiteVisit;
import com.spaceup.domain.visit.entity.SiteVisitStatus;
import com.spaceup.domain.visit.repository.SiteVisitRepository;
import com.spaceup.domain.visit.service.SiteVisitService;

@ExtendWith(MockitoExtension.class)
class ContractorQuoteMultiContractorTest {

	@Mock ContractorQuoteRepository contractorQuoteRepository;
	@Mock QuoteRequestRepository quoteRequestRepository;
	@Mock RequestContractorRepository requestContractorRepository;
	@Mock MemberRepository memberRepository;
	@Mock NotificationService notificationService;
	@Mock SiteVisitService siteVisitService;
	@Mock SiteVisitRepository siteVisitRepository;
	@Mock AnalysisJobRepository analysisJobRepository;
	@InjectMocks ContractorQuoteService service;

	@Test
	void acceptingOneQuoteSelectsItsContractorAndClosesTheOthers() {
		Member owner = Member.builder().id(10L).name("owner").build();
		Member selectedContractor = Member.builder().id(20L).name("selected").build();
		Member otherContractor = Member.builder().id(30L).name("other").build();
		Property property = Property.builder().owner(owner).region("Gwangju").build();
		QuoteRequest request = QuoteRequest.builder().id(1L).owner(owner).property(property)
				.status(RequestStatus.QUOTE_REQUESTED).build();
		ContractorQuote quote = ContractorQuote.builder().id(100L).request(request).contractor(selectedContractor)
				.status(QuoteStatus.SUBMITTED).title("selected quote").totalAmount(1_000_000L).build();
		RequestContractor selected = RequestContractor.builder().id(1000L).request(request)
				.contractor(selectedContractor).status(RequestContractorStatus.APPROVED).build();
		RequestContractor other = RequestContractor.builder().id(2000L).request(request)
				.contractor(otherContractor).status(RequestContractorStatus.APPROVED).build();

		when(contractorQuoteRepository.findById(100L)).thenReturn(Optional.of(quote));
		when(quoteRequestRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(request));
		when(contractorQuoteRepository.findFirstByRequestIdAndPhaseAndStatusOrderByUpdatedAtDesc(
				1L, QuotePhase.PRELIMINARY, QuoteStatus.ACCEPTED)).thenReturn(Optional.empty());
		when(requestContractorRepository.findByRequestIdAndContractorId(1L, 20L))
				.thenReturn(Optional.of(selected));
		when(requestContractorRepository.findByRequestId(1L)).thenReturn(List.of(selected, other));

		service.accept(100L, 10L);

		assertEquals(QuoteStatus.ACCEPTED, quote.getStatus());
		assertEquals(RequestContractorStatus.SELECTED, selected.getStatus());
		assertEquals(RequestContractorStatus.CLOSED, other.getStatus());
		assertEquals(RequestStatus.APPROVED, request.getStatus());
		assertSame(selectedContractor, request.getContractor());
	}

	@Test
	void createsFinalDraftOnlyForSelectedContractorAfterCompletedVisit() {
		Member owner = Member.builder().id(10L).name("owner").build();
		Member contractor = Member.builder().id(20L).name("contractor").build();
		QuoteRequest request = QuoteRequest.builder().id(1L).owner(owner)
				.status(RequestStatus.APPROVED).build();
		RequestContractor participation = RequestContractor.builder().id(100L).request(request)
				.contractor(contractor).status(RequestContractorStatus.SELECTED).build();
		SiteVisit completedVisit = SiteVisit.builder().id(30L).request(request).contractor(contractor)
				.status(SiteVisitStatus.COMPLETED).build();

		when(quoteRequestRepository.findById(1L)).thenReturn(Optional.of(request));
		when(requestContractorRepository.findByRequestIdAndContractorId(1L, 20L)).thenReturn(Optional.of(participation));
		when(memberRepository.findById(20L)).thenReturn(Optional.of(contractor));
		when(siteVisitRepository.findByRequestIdAndContractorId(1L, 20L)).thenReturn(Optional.of(completedVisit));

		service.createDraft(20L, quoteDraftRequest(1L));

		ArgumentCaptor<ContractorQuote> quoteCaptor = ArgumentCaptor.forClass(ContractorQuote.class);
		verify(contractorQuoteRepository).save(quoteCaptor.capture());
		assertEquals(QuotePhase.FINAL, quoteCaptor.getValue().getPhase());
	}

	@Test
	void blocksFinalDraftUntilSiteVisitIsCompleted() {
		Member owner = Member.builder().id(10L).name("owner").build();
		Member contractor = Member.builder().id(20L).name("contractor").build();
		QuoteRequest request = QuoteRequest.builder().id(1L).owner(owner)
				.status(RequestStatus.APPROVED).build();
		RequestContractor participation = RequestContractor.builder().id(100L).request(request)
				.contractor(contractor).status(RequestContractorStatus.SELECTED).build();

		when(quoteRequestRepository.findById(1L)).thenReturn(Optional.of(request));
		when(requestContractorRepository.findByRequestIdAndContractorId(1L, 20L)).thenReturn(Optional.of(participation));
		when(siteVisitRepository.findByRequestIdAndContractorId(1L, 20L)).thenReturn(Optional.empty());

		assertThrows(com.spaceup.global.error.InvalidStatusTransitionException.class,
				() -> service.createDraft(20L, quoteDraftRequest(1L)));
	}

	private ContractorQuoteCreateRequest quoteDraftRequest(Long requestId) {
		ContractorQuoteItemRequest item = new ContractorQuoteItemRequest();
		item.setCategory("바닥");
		item.setAmount(1_000_000L);
		ContractorQuoteCreateRequest request = new ContractorQuoteCreateRequest();
		request.setRequestId(requestId);
		request.setTitle("견적");
		request.setItems(List.of(item));
		return request;
	}
}
