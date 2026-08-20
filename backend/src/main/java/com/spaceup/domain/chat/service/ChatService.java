package com.spaceup.domain.chat.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.chat.dto.ChatMessageResponse;
import com.spaceup.domain.chat.dto.ChatThreadResponse;
import com.spaceup.domain.chat.entity.ChatMessage;
import com.spaceup.domain.chat.entity.ChatSenderType;
import com.spaceup.domain.chat.repository.ChatMessageRepository;
import com.spaceup.domain.contractor.entity.ContractorProfile;
import com.spaceup.domain.contractor.repository.ContractorProfileRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestContractor;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.RequestNotFoundException;
import com.spaceup.global.realtime.RealtimeDomainEvent;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

	private final ChatMessageRepository chatMessageRepository;
	private final ContractorProfileRepository contractorProfileRepository;
	private final QuoteRequestRepository quoteRequestRepository;
	private final RequestContractorRepository requestContractorRepository;
	private final MemberRepository memberRepository;
	private final NotificationService notificationService;
	private final ApplicationEventPublisher eventPublisher;

	public List<ChatThreadResponse> getThreads(Long memberId) {
		Member member = findMemberOrThrow(memberId);
		List<RequestContractor> participations;
		if (member.getRole() == MemberRole.CONTRACTOR) {
			participations = requestContractorRepository.findByContractorId(memberId);
		} else {
			List<Long> requestIds = quoteRequestRepository.findByOwnerId(memberId).stream()
					.map(QuoteRequest::getId).toList();
			participations = requestIds.stream().flatMap(requestId -> requestContractorRepository
					.findByRequestId(requestId).stream()).toList();
		}

		Set<String> seenThreads = new HashSet<>();
		return participations.stream()
				.filter(participation -> seenThreads.add(participation.getRequest().getId() + ":"
						+ participation.getContractor().getId()))
				.map(participation -> toThread(participation, member))
				.sorted(Comparator.comparing(ChatThreadResponse::lastMessageAt,
						Comparator.nullsLast(Comparator.reverseOrder())))
				.toList();
	}

	public List<ChatMessageResponse> getMessages(Long requestId, Long contractorId, Long memberId) {
		RequestContractor participation = resolveParticipation(requestId, contractorId, memberId);
		return chatMessageRepository.findByRequestIdAndContractorIdOrderByCreatedAtAsc(requestId,
				participation.getContractor().getId()).stream().map(ChatMessageResponse::new).toList();
	}

	@Transactional
	public ChatMessageResponse sendMessage(Long requestId, Long contractorId, Long memberId, String content) {
		RequestContractor participation = resolveParticipation(requestId, contractorId, memberId);
		if (!participation.canContact()) {
			throw new ForbiddenAccessException("최종 시공사 확정으로 종료된 채팅방에는 메시지를 보낼 수 없습니다.");
		}
		QuoteRequest request = participation.getRequest();
		Member sender = findMemberOrThrow(memberId);
		boolean landlord = request.getOwner().getId().equals(memberId);
		ChatSenderType senderType = landlord ? ChatSenderType.LANDLORD : ChatSenderType.CONTRACTOR;

		ChatMessage message = ChatMessage.builder().request(request).contractor(participation.getContractor())
				.senderType(senderType).sender(sender).content(content).build();
		chatMessageRepository.save(message);
		request.touch();

		Long receiverId = landlord ? participation.getContractor().getId() : request.getOwner().getId();
		notificationService.notifyForRequest(receiverId, NotificationType.CHAT, "새 채팅 메시지가 도착했습니다",
				String.format("%s: %s", sender.getName(), truncate(content)), requestId,
				participation.getContractor().getId());
		eventPublisher.publishEvent(RealtimeDomainEvent.chatMessage(memberId, requestId,
				participation.getContractor().getId(), message.getId()));
		eventPublisher.publishEvent(RealtimeDomainEvent.chatMessage(receiverId, requestId,
				participation.getContractor().getId(), message.getId()));
		return new ChatMessageResponse(message);
	}

	@Transactional
	public ChatMessageResponse sendSystemMessage(QuoteRequest request, Member contractor, String content) {
		ChatMessage message = ChatMessage.builder().request(request).contractor(contractor)
				.senderType(ChatSenderType.SYSTEM).content(content).build();
		chatMessageRepository.save(message);
		request.touch();

		Long requestId = request.getId();
		Long contractorId = contractor.getId();
		Long landlordId = request.getOwner().getId();
		eventPublisher.publishEvent(RealtimeDomainEvent.chatMessage(landlordId, requestId, contractorId,
				message.getId()));
		if (!contractorId.equals(landlordId)) {
			eventPublisher.publishEvent(RealtimeDomainEvent.chatMessage(contractorId, requestId, contractorId,
					message.getId()));
		}
		return new ChatMessageResponse(message);
	}

	@Transactional
	public void markThreadAsRead(Long requestId, Long contractorId, Long memberId) {
		RequestContractor participation = resolveParticipation(requestId, contractorId, memberId);
		chatMessageRepository.findUnreadFromOtherMembers(requestId, participation.getContractor().getId(),
				memberId).forEach(ChatMessage::markAsRead);
	}

	private ChatThreadResponse toThread(RequestContractor participation, Member viewer) {
		List<ChatMessage> messages = chatMessageRepository.findByRequestIdAndContractorIdOrderByCreatedAtAsc(
				participation.getRequest().getId(), participation.getContractor().getId());
		ChatMessage last = messages.isEmpty() ? null : messages.get(messages.size() - 1);
		long unread = messages.stream().filter(message -> !message.isRead() && !isSentBy(message, viewer)).count();
		String counterpart = viewer.getRole() == MemberRole.CONTRACTOR
				? participation.getRequest().getOwner().getName()
				: contractorProfileRepository.findByMemberId(participation.getContractor().getId())
						.map(ContractorProfile::getCompanyName)
						.filter(name -> name != null && !name.isBlank())
						.orElse(participation.getContractor().getName());
		return new ChatThreadResponse(participation.getRequest().getId(), participation.getContractor().getId(),
				participation.getRequest().getRequestCode(), counterpart, participation.getRequest().getStatus(),
				participation.getStatus(), participation.canContact(),
				last != null ? last.getContent() : null, last != null ? last.getCreatedAt() : null, unread);
	}

	private RequestContractor resolveParticipation(Long requestId, Long requestedContractorId, Long memberId) {
		QuoteRequest request = quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
		if (request.getOwner().getId().equals(memberId)) {
			if (requestedContractorId != null) {
				return findParticipation(requestId, requestedContractorId);
			}
			List<RequestContractor> candidates = requestContractorRepository.findByRequestId(requestId);
			if (candidates.size() != 1) {
				throw new IllegalArgumentException("여러 시공사와 연결된 의뢰는 contractorId가 필요합니다.");
			}
			return candidates.get(0);
		}
		if (requestedContractorId != null && !requestedContractorId.equals(memberId)) {
			throw new ForbiddenAccessException("다른 시공사의 채팅방에는 접근할 수 없습니다.");
		}
		return findParticipation(requestId, memberId);
	}

	private RequestContractor findParticipation(Long requestId, Long contractorId) {
		return requestContractorRepository.findByRequestIdAndContractorId(requestId, contractorId)
				.orElseThrow(() -> new ForbiddenAccessException("참여 중인 견적 채팅방만 이용할 수 있습니다."));
	}

	private Member findMemberOrThrow(Long memberId) {
		return memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원입니다: " + memberId));
	}

	private boolean isSentBy(ChatMessage message, Member member) {
		return message.getSender() != null && message.getSender().getId().equals(member.getId());
	}

	private String truncate(String content) {
		return content.length() > 50 ? content.substring(0, 50) + "..." : content;
	}
}
