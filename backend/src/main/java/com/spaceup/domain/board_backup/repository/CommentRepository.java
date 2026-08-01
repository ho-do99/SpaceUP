package com.spaceup.domain.board_backup.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.board_backup.entity.Comment;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

	// ⭐ 댓글 필수 기능: 특정 게시글 고유 번호(boardId)를 던지면 그 글에 달린 댓글 목록만 순서대로(Id Asc) 싹 긁어오는
	// 메서드입니다.
	List<Comment> findByBoardIdOrderByIdAsc(Long boardId);
}
