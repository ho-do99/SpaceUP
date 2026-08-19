package com.spaceup.domain.chat.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.chat.repository.ChatMessageRepository;
import com.spaceup.domain.contractor.repository.ContractorProfileRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestContractor;
import com.spaceup.domain.request.entity.RequestContractorStatus;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.global.error.ForbiddenAccessException;

@ExtendWith(MockitoExtension.class)
class ChatServiceMultiContractorTest {

	@Mock ChatMessageRepository chatMessageRepository;
	@Mock ContractorProfileRepository contractorProfileRepository;
	@Mock QuoteRequestRepository quoteRequestRepository;
	@Mock RequestContractorRepository requestContractorRepository;
	@Mock MemberRepository memberRepository;
	@Mock NotificationService notificationService;
	@InjectMocks ChatService service;

	@Test
	void landlordReadsOnlyTheSelectedContractorThread() {
		Member owner = Member.builder().id(1L).role(MemberRole.LANDLORD).build();
		Member contractor = Member.builder().id(2L).role(MemberRole.CONTRACTOR).build();
		QuoteRequest request = QuoteRequest.builder().id(10L).owner(owner).status(RequestStatus.REVIEWING).build();
		RequestContractor participation = RequestContractor.builder().request(request).contractor(contractor)
				.status(RequestContractorStatus.APPROVED).build();
		when(quoteRequestRepository.findById(10L)).thenReturn(Optional.of(request));
		when(requestContractorRepository.findByRequestIdAndContractorId(10L, 2L))
				.thenReturn(Optional.of(participation));
		when(chatMessageRepository.findByRequestIdAndContractorIdOrderByCreatedAtAsc(10L, 2L))
				.thenReturn(List.of());

		assertEquals(0, service.getMessages(10L, 2L, 1L).size());
		verify(chatMessageRepository).findByRequestIdAndContractorIdOrderByCreatedAtAsc(10L, 2L);
	}

	@Test
	void closedContractorCannotSendAfterAnotherContractorIsSelected() {
		Member owner = Member.builder().id(1L).role(MemberRole.LANDLORD).build();
		Member contractor = Member.builder().id(2L).role(MemberRole.CONTRACTOR).build();
		QuoteRequest request = QuoteRequest.builder().id(10L).owner(owner).status(RequestStatus.APPROVED).build();
		RequestContractor participation = RequestContractor.builder().request(request).contractor(contractor)
				.status(RequestContractorStatus.CLOSED).build();
		when(quoteRequestRepository.findById(10L)).thenReturn(Optional.of(request));
		when(requestContractorRepository.findByRequestIdAndContractorId(10L, 2L))
				.thenReturn(Optional.of(participation));

		assertThrows(ForbiddenAccessException.class, () -> service.sendMessage(10L, null, 2L, "message"));
	}
	@Test
	void exactDuplicateParticipationsProduceOnlyOneThreadPerRequestAndContractor() {
		Member owner = Member.builder().id(1L).name("owner").role(MemberRole.LANDLORD).build();
		Member contractor = Member.builder().id(2L).name("contractor").role(MemberRole.CONTRACTOR).build();
		QuoteRequest request = QuoteRequest.builder().id(10L).requestCode("REQ-10").owner(owner)
				.status(RequestStatus.QUOTE_REQUESTED).build();
		RequestContractor first = RequestContractor.builder().request(request).contractor(contractor)
				.status(RequestContractorStatus.APPROVED).build();
		RequestContractor duplicate = RequestContractor.builder().request(request).contractor(contractor)
				.status(RequestContractorStatus.APPROVED).build();
		when(memberRepository.findById(1L)).thenReturn(Optional.of(owner));
		when(quoteRequestRepository.findByOwnerId(1L)).thenReturn(List.of(request));
		when(requestContractorRepository.findByRequestId(10L)).thenReturn(List.of(first, duplicate));
		when(chatMessageRepository.findByRequestIdAndContractorIdOrderByCreatedAtAsc(10L, 2L)).thenReturn(List.of());

		assertEquals(1, service.getThreads(1L).size());
	}
}
