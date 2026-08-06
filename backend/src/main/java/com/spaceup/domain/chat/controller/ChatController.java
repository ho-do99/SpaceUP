package com.spaceup.domain.chat.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.chat.dto.ChatMessageResponse;
import com.spaceup.domain.chat.dto.ChatMessageSendRequest;
import com.spaceup.domain.chat.dto.ChatThreadResponse;
import com.spaceup.domain.chat.service.ChatService;
import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "채팅" 화면(임대인/시공사 공용, 의뢰 1건당 스레드 1개)
@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

	private final ChatService chatService;

	// ⭐ ContractorChatListPage 대응 - 로그인한 회원(임대인/시공사)이 참여 중인 스레드 목록
	@GetMapping("/threads")
	public ResponseEntity<ApiResponse<List<ChatThreadResponse>>> getThreads(Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("채팅 목록 조회 완료", chatService.getThreads(getMemberId(authentication))));
	}

	@GetMapping("/{requestId}/messages")
	public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(@PathVariable Long requestId,
			Authentication authentication) {
		return ResponseEntity.ok(
				ApiResponse.success("메시지 조회 완료", chatService.getMessages(requestId, getMemberId(authentication))));
	}

	@PostMapping("/{requestId}/messages")
	public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(@PathVariable Long requestId,
			@Valid @RequestBody ChatMessageSendRequest request, Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("메시지를 전송했습니다.",
				chatService.sendMessage(requestId, getMemberId(authentication), request.getContent())));
	}

	@PostMapping("/{requestId}/read")
	public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long requestId, Authentication authentication) {
		chatService.markThreadAsRead(requestId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("읽음 처리했습니다.", null));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
