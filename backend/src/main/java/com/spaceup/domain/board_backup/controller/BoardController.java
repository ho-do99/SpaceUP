package com.spaceup.domain.board_backup.controller;

import jakarta.validation.Valid;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.spaceup.domain.board_backup.dto.BoardResponse;
import com.spaceup.domain.board_backup.dto.BoardUpdateRequest;
import com.spaceup.domain.board_backup.dto.BoardWriteRequest;
import com.spaceup.domain.board_backup.entity.UploadFile;
import com.spaceup.domain.board_backup.service.BoardService;
import com.spaceup.domain.board_backup.service.FileStoreService;
import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardController {

	private final BoardService boardService;
	private final FileStoreService fileStoreService;

	// ⭐ [최종 검토 반영] memberId를 request.getMemberId()(클라이언트 입력값) 대신
	// Authentication(JWT)에서 가져오도록 수정했습니다. 기존 코드는 로그인한 누구나 임의의
	// memberId를 보내 다른 회원 명의로 글을 쓸 수 있는 사칭 취약점이 있었습니다.
	@PostMapping(value = "/write", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> write(@Valid @RequestPart("request") BoardWriteRequest request,
			@RequestPart(value = "file", required = false) MultipartFile file, Authentication authentication)
			throws IOException {
		Long memberId = getMemberIdFromAuthentication(authentication);
		boardService.write(memberId, request.getTitle(), request.getContent(), request.getBoardType(), file);
		return ResponseEntity.ok(ApiResponse.success("글 작성 및 파일 업로드가 성공했습니다.", null));
	}

	@GetMapping("/list/{boardType}")
	public ResponseEntity<ApiResponse<Page<BoardResponse>>> getList(@PathVariable("boardType") String boardType,
			@PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
		return ResponseEntity
				.ok(ApiResponse.success("게시판 목록 조회 완료", boardService.getBoardsByType(boardType, pageable)));
	}

	@GetMapping("/{boardId}")
	public ResponseEntity<ApiResponse<BoardResponse>> getDetail(@PathVariable Long boardId) {
		return ResponseEntity.ok(ApiResponse.success("게시글 상세 조회 완료", boardService.getDetail(boardId)));
	}

	@PutMapping("/{boardId}")
	public ResponseEntity<ApiResponse<Void>> update(@PathVariable Long boardId,
			@Valid @RequestBody BoardUpdateRequest request, Authentication authentication) {
		Long requesterId = getMemberIdFromAuthentication(authentication);
		boardService.update(boardId, requesterId, request.getTitle(), request.getContent());
		return ResponseEntity.ok(ApiResponse.success("게시글이 수정되었습니다.", null));
	}

	@DeleteMapping("/{boardId}")
	public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long boardId, Authentication authentication) {
		Long requesterId = getMemberIdFromAuthentication(authentication);
		boardService.delete(boardId, requesterId);
		return ResponseEntity.ok(ApiResponse.success("게시글이 삭제되었습니다.", null));
	}

	@GetMapping("/file/{fileId}")
	public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) throws UnsupportedEncodingException {
		UploadFile uploadFile = fileStoreService.getFile(fileId);
		Resource resource = fileStoreService.loadFileAsResource(uploadFile);

		String encodedFileName = URLEncoder.encode(uploadFile.getUploadFileName(), StandardCharsets.UTF_8)
				.replaceAll("\\+", "%20");

		return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
				.body(resource);
	}

	private Long getMemberIdFromAuthentication(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
