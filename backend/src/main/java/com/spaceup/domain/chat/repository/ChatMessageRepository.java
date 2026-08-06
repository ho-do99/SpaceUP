package com.spaceup.domain.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.chat.entity.ChatMessage;
import com.spaceup.domain.chat.entity.ChatSenderType;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

	List<ChatMessage> findByRequestIdOrderByCreatedAtAsc(Long requestId);

	// ⭐ 스레드 목록 화면(최근메시지/안읽음개수)용 - 여러 의뢰의 메시지를 한 번에 최신순으로 긁어와 서비스에서 그룹핑
	List<ChatMessage> findByRequestIdInOrderByCreatedAtDesc(List<Long> requestIds);

	List<ChatMessage> findByRequestIdAndSenderTypeNotAndReadFalse(Long requestId, ChatSenderType excludeSenderType);
}
