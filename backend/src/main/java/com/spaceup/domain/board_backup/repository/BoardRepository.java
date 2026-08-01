package com.spaceup.domain.board_backup.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.spaceup.domain.board_backup.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Long> {
	Page<Board> findByBoardTypeOrderByIdDesc(String boardType, Pageable pageable);
}