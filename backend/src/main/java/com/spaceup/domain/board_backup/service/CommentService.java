package com.spaceup.domain.board_backup.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.board_backup.dto.CommentResponse;
import com.spaceup.domain.board_backup.entity.Board;
import com.spaceup.domain.board_backup.entity.Comment;
import com.spaceup.domain.board_backup.repository.BoardRepository;
import com.spaceup.domain.board_backup.repository.CommentRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.global.error.BoardNotFoundException;
import com.spaceup.global.error.CommentNotFoundException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.UnauthorizedAccessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

	private final CommentRepository commentRepository;
	private final BoardRepository boardRepository;
	private final MemberRepository memberRepository;

	@Transactional
	public Long writeComment(Long boardId, Long memberId, String content) {
		Board board = boardRepository.findById(boardId)
				.orElseThrow(() -> new BoardNotFoundException("존재하지 않는 게시글 번호입니다: " + boardId));
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));

		Comment comment = Comment.builder().content(content).board(board).member(member).build();
		commentRepository.save(comment);
		return comment.getId();
	}

	// 여기가 핵심 변경 부분: List<Comment> 가 아니라 List<CommentResponse> 를 반환
	public List<CommentResponse> getCommentsByBoard(Long boardId) {
		return commentRepository.findByBoardIdOrderByIdAsc(boardId).stream().map(CommentResponse::new).toList();
	}

	@Transactional
	public void updateComment(Long commentId, Long requesterId, String content) {
		Comment comment = commentRepository.findById(commentId)
				.orElseThrow(() -> new CommentNotFoundException("존재하지 않는 댓글 번호입니다: " + commentId));

		if (!comment.getMember().getId().equals(requesterId)) {
			throw new UnauthorizedAccessException("본인이 작성한 댓글만 수정할 수 있습니다.");
		}
		comment.update(content);
	}

	@Transactional
	public void deleteComment(Long commentId, Long requesterId) {
		Comment comment = commentRepository.findById(commentId)
				.orElseThrow(() -> new CommentNotFoundException("존재하지 않는 댓글 번호입니다: " + commentId));

		if (!comment.getMember().getId().equals(requesterId)) {
			throw new UnauthorizedAccessException("본인이 작성한 댓글만 삭제할 수 있습니다.");
		}
		commentRepository.delete(comment);
	}
}