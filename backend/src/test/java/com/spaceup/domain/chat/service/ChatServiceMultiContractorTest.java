package com.spaceup.domain.chat.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.springframework.context.ApplicationEventPublisher;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.chat.entity.ChatMessage;
import com.spaceup.domain.chat.entity.ChatSenderType;
import com.spaceup.domain.chat.repository.ChatMessageRepository;
import com.spaceup.domain.contractor.repository.ContractorProfileRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.entity.NotificationType;
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
	@Mock ApplicationEventPublisher eventPublisher;
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
	void sendingMessagePersistsChatNotificationWithProductionEnumType() {
		Member owner = Member.builder().id(1L).name("시연 임대인").role(MemberRole.LANDLORD).build();
		Member contractor = Member.builder().id(2L).name("시연 시공사").role(MemberRole.CONTRACTOR).build();
		QuoteRequest request = QuoteRequest.builder().id(10L).owner(owner)
				.status(RequestStatus.QUOTE_REQUESTED).build();
		RequestContractor participation = RequestContractor.builder().request(request).contractor(contractor)
				.status(RequestContractorStatus.APPROVED).build();
		when(quoteRequestRepository.findById(10L)).thenReturn(Optional.of(request));
		when(requestContractorRepository.findByRequestIdAndContractorId(10L, 2L))
				.thenReturn(Optional.of(participation));
		when(memberRepository.findById(1L)).thenReturn(Optional.of(owner));
		when(chatMessageRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

		service.sendMessage(10L, 2L, 1L, "방문 일정을 조율해요");

		verify(notificationService).notifyForRequest(eq(2L), eq(NotificationType.CHAT),
				eq("새 채팅 메시지가 도착했습니다"), eq("시연 임대인: 방문 일정을 조율해요"),
				eq(10L), eq(2L));
	}

	@Test
	void systemMessageHasNoSenderToSatisfyDatabaseConstraint() {
		Member owner = Member.builder().id(1L).role(MemberRole.LANDLORD).build();
		Member contractor = Member.builder().id(2L).role(MemberRole.CONTRACTOR).build();
		QuoteRequest request = QuoteRequest.builder().id(10L).owner(owner)
				.status(RequestStatus.QUOTE_REQUESTED).build();
		when(chatMessageRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

		service.sendSystemMessage(request, contractor, "방문 일정이 등록되었습니다.");

		ArgumentCaptor<ChatMessage> messageCaptor = ArgumentCaptor.forClass(ChatMessage.class);
		verify(chatMessageRepository).save(messageCaptor.capture());
		assertEquals(ChatSenderType.SYSTEM, messageCaptor.getValue().getSenderType());
		assertNull(messageCaptor.getValue().getSender());
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
