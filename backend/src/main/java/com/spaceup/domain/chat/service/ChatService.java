package com.spaceup.domain.chat.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.chat.dto.ChatMessageResponse;
import com.spaceup.domain.chat.dto.ChatThreadResponse;
import com.spaceup.domain.chat.entity.ChatMessage;
import com.spaceup.domain.chat.entity.ChatSenderType;
import com.spaceup.domain.chat.repository.ChatMessageRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.RequestNotFoundException;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "채팅" 화면. 의뢰(QuoteRequest) 1건당 스레드 1개, 별도 스레드 엔티티 없이 requestId로 묶습니다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

	private final ChatMessageRepository chatMessageRepository;
	private final QuoteRequestRepository quoteRequestRepository;
	private final MemberRepository memberRepository;
	private final NotificationService notificationService;

	// ⭐ 로그인한 회원이 참여 중인 모든 스레드(임대인이면 본인 의뢰 전체, 시공사면 배정받은 의뢰 전체) 목록
	public List<ChatThreadResponse> getThreads(Long memberId) {
		Member member = findMemberOrThrow(memberId);
		List<QuoteRequest> requests = member.getRole() == MemberRole.CONTRACTOR
				? quoteRequestRepository.findByContractorId(memberId)
				: quoteRequestRepository.findByOwnerId(memberId);

		if (requests.isEmpty()) {
			return List.of();
		}

		List<Long> requestIds = requests.stream().map(QuoteRequest::getId).toList();
		Map<Long, List<ChatMessage>> messagesByRequest = chatMessageRepository
				.findByRequestIdInOrderByCreatedAtDesc(requestIds).stream()
				.collect(Collectors.groupingBy(m -> m.getRequest().getId()));

		return requests.stream().map(request -> {
			List<ChatMessage> messages = messagesByRequest.getOrDefault(request.getId(), List.of());
			ChatMessage last = messages.isEmpty() ? null : messages.get(0);
			long unread = messages.stream().filter(m -> !m.isRead() && !isSentBy(m, member)).count();
			String counterpartName = member.getRole() == MemberRole.CONTRACTOR ? request.getOwner().getName()
					: (request.getContractor() != null ? request.getContractor().getName() : "미배정");
			return new ChatThreadResponse(request.getId(), request.getRequestCode(), counterpartName,
					request.getStatus(), last != null ? last.getContent() : null,
					last != null ? last.getCreatedAt() : null, unread);
		}).sorted(Comparator.comparing(ChatThreadResponse::lastMessageAt,
				Comparator.nullsLast(Comparator.reverseOrder()))).toList();
	}

	public List<ChatMessageResponse> getMessages(Long requestId, Long memberId) {
		QuoteRequest request = findRequestOrThrow(requestId);
		validateParticipant(request, memberId);
		return chatMessageRepository.findByRequestIdOrderByCreatedAtAsc(requestId).stream()
				.map(ChatMessageResponse::new).toList();
	}

	// ⭐ 본인 역할(임대인/시공사)에 맞춰 senderType을 자동 결정하고, 상대방에게 알림을 보냅니다.
	@Transactional
	public ChatMessageResponse sendMessage(Long requestId, Long memberId, String content) {
		QuoteRequest request = findRequestOrThrow(requestId);
		Member sender = validateParticipant(request, memberId);
		if (request.getContractor() == null) {
			throw new ForbiddenAccessException("시공사가 배정된 이후부터 채팅을 이용할 수 있습니다.");
		}

		ChatSenderType senderType = sender.getId().equals(request.getOwner().getId()) ? ChatSenderType.LANDLORD
				: ChatSenderType.CONTRACTOR;

		ChatMessage message = ChatMessage.builder().request(request).senderType(senderType).sender(sender)
				.content(content).build();
		chatMessageRepository.save(message);
		request.touch();

		Long receiverId = senderType == ChatSenderType.LANDLORD ? request.getContractor().getId()
				: request.getOwner().getId();
		notificationService.notify(receiverId, NotificationType.CHAT, "새 채팅 메시지가 도착했습니다",
				String.format("%s님: %s", sender.getName(), truncate(content)));

		return new ChatMessageResponse(message);
	}

	// ⭐ 본인이 보내지 않은 메시지만 읽음 처리 (본인이 보낸 메시지는 항상 이미 읽은 것으로 취급)
	@Transactional
	public void markThreadAsRead(Long requestId, Long memberId) {
		QuoteRequest request = findRequestOrThrow(requestId);
		Member member = validateParticipant(request, memberId);
		ChatSenderType myType = member.getId().equals(request.getOwner().getId()) ? ChatSenderType.LANDLORD
				: ChatSenderType.CONTRACTOR;
		chatMessageRepository.findByRequestIdAndSenderTypeNotAndReadFalse(requestId, myType)
				.forEach(ChatMessage::markAsRead);
	}

	private boolean isSentBy(ChatMessage message, Member member) {
		return message.getSender() != null && message.getSender().getId().equals(member.getId());
	}

	private String truncate(String content) {
		return content.length() > 50 ? content.substring(0, 50) + "..." : content;
	}

	private Member validateParticipant(QuoteRequest request, Long memberId) {
		boolean isOwner = request.getOwner().getId().equals(memberId);
		boolean isContractor = request.getContractor() != null && request.getContractor().getId().equals(memberId);
		if (!isOwner && !isContractor) {
			throw new ForbiddenAccessException("본인이 참여 중인 채팅만 조회할 수 있습니다.");
		}
		return findMemberOrThrow(memberId);
	}

	private Member findMemberOrThrow(Long memberId) {
		return memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
	}

	private QuoteRequest findRequestOrThrow(Long requestId) {
		return quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
	}
}
