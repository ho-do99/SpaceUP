package com.spaceup.domain.chat.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ [프론트 연동] 의뢰(QuoteRequest) 1개당 채팅 스레드 1개. 별도 스레드 엔티티 없이 requestId로 묶습니다.
@Entity
@Table(name = "chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ChatMessage extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "request_id", nullable = false)
	private QuoteRequest request;

	@Enumerated(EnumType.STRING)
	@Column(name = "sender_type", nullable = false, length = 20)
	private ChatSenderType senderType;

	// ⭐ SYSTEM 메시지는 보낸 회원이 없어 null 허용
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sender_id")
	private Member sender;

	@Column(nullable = false, length = 1000)
	private String content;

	// ⭐ READ는 MySQL 예약어라 컬럼명만 is_read로 지정 (Notification과 동일 패턴)
	@Builder.Default
	@Column(name = "is_read", nullable = false)
	private boolean read = false;

	public void markAsRead() {
		this.read = true;
	}
}
