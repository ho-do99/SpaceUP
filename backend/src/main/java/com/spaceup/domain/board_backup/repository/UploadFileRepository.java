package com.spaceup.domain.board_backup.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.board_backup.entity.UploadFile;

@Repository
public interface UploadFileRepository extends JpaRepository<UploadFile, Long> {

	// ⭐ 첨부파일 필수 기능: 게시글 번호(boardId)를 던지면 그 글에 연결된 모든 첨부파일 목록을 긁어오는 메서드입니다.
	List<UploadFile> findByBoardId(Long boardId);
}
