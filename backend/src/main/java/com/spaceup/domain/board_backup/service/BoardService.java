package com.spaceup.domain.board_backup.service;

import java.io.IOException;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.spaceup.domain.board_backup.dto.BoardResponse;
import com.spaceup.domain.board_backup.entity.Board;
import com.spaceup.domain.board_backup.entity.UploadFile;
import com.spaceup.domain.board_backup.repository.BoardRepository;
import com.spaceup.domain.board_backup.repository.UploadFileRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.global.error.BoardNotFoundException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.UnauthorizedAccessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardService {

	private final BoardRepository boardRepository;
	private final MemberRepository memberRepository;
	private final UploadFileRepository uploadFileRepository;
	private final FileStoreService fileStoreService;

	@Transactional
	public Long write(Long memberId, String title, String content, String boardType, MultipartFile file)
			throws IOException {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));

		Board board = Board.builder().title(title).content(content).boardType(boardType).member(member).build();
		boardRepository.save(board);

		if (file != null && !file.isEmpty()) {
			fileStoreService.storeFile(file, board);
		}
		return board.getId();
	}

	public Page<BoardResponse> getBoardsByType(String boardType, Pageable pageable) {
		return boardRepository.findByBoardTypeOrderByIdDesc(boardType, pageable).map(BoardResponse::new);
	}

	@Transactional
	public BoardResponse getDetail(Long boardId) {
		Board board = boardRepository.findById(boardId)
				.orElseThrow(() -> new BoardNotFoundException("존재하지 않는 게시글 번호입니다: " + boardId));
		board.increaseViewCount();
		List<UploadFile> files = uploadFileRepository.findByBoardId(boardId);
		return new BoardResponse(board, files);
	}

	@Transactional
	public void update(Long boardId, Long requesterId, String title, String content) {
		Board board = boardRepository.findById(boardId)
				.orElseThrow(() -> new BoardNotFoundException("존재하지 않는 게시글 번호입니다: " + boardId));

		if (!board.getMember().getId().equals(requesterId)) {
			throw new UnauthorizedAccessException("본인이 작성한 게시글만 수정할 수 있습니다.");
		}
		board.update(title, content);
	}

	@Transactional
	public void delete(Long boardId, Long requesterId) {
		Board board = boardRepository.findById(boardId)
				.orElseThrow(() -> new BoardNotFoundException("존재하지 않는 게시글 번호입니다: " + boardId));

		if (!board.getMember().getId().equals(requesterId)) {
			throw new UnauthorizedAccessException("본인이 작성한 게시글만 삭제할 수 있습니다.");
		}
		boardRepository.delete(board);
	}
}