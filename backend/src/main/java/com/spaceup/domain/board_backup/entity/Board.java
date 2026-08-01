package com.spaceup.domain.board_backup.entity;

import java.time.LocalDateTime;

import com.spaceup.domain.member.entity.Member;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "boards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Board {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String title;

	@Column(nullable = false, columnDefinition = "TEXT") // 대용량 글 텍스트를 저장하기 위한 설정
	private String content;

	@Column(name = "board_type", nullable = false, length = 20)
	private String boardType; // ⭐ 핵심: 여기에 'FREE', 'NOTICE', 'SUGGESTION' 등을 넣어 게시판 종류를 구분합니다.

	@Column(name = "view_count", nullable = false)
	private int viewCount; // 조회수

	@ManyToOne(fetch = FetchType.LAZY) // ⭐ 최신 현업 필수: 회원 테이블과 유기적 연결 (지연 로딩 성능 최적화)
	@JoinColumn(name = "member_id", nullable = false)
	private Member member; // 글쓴이 정보 상자 연결

	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	protected void onCreate() {
		this.createdAt = LocalDateTime.now();
		this.viewCount = 0; // 글이 처음 등록될 때 조회수는 0으로 세팅
	}

	public void increaseViewCount() {
		this.viewCount++;
	}

	public void update(String title, String content) {
		this.title = title;
		this.content = content;
	}
}
