package com.spaceup.domain.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.chat.entity.ChatMessage;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

	List<ChatMessage> findByRequestIdAndContractorIdOrderByCreatedAtAsc(Long requestId, Long contractorId);

	// ⭐ 스레드 목록 화면(최근메시지/안읽음개수)용 - 여러 의뢰의 메시지를 한 번에 최신순으로 긁어와 서비스에서 그룹핑
	List<ChatMessage> findByRequestIdInOrderByCreatedAtDesc(List<Long> requestIds);

	@Query("""
			select message from ChatMessage message
			where message.request.id = :requestId
			  and message.contractor.id = :contractorId
			  and message.read = false
			  and (message.sender is null or message.sender.id <> :memberId)
			""")
	List<ChatMessage> findUnreadFromOtherMembers(@Param("requestId") Long requestId,
			@Param("contractorId") Long contractorId, @Param("memberId") Long memberId);
}
