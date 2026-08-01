package com.spaceup.domain.board_backup.entity;

import java.time.LocalDateTime;

import com.spaceup.domain.member.entity.Member;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Comment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content; // 댓글 내용

	@ManyToOne(fetch = FetchType.LAZY) // ⭐ 관계설정 1: "댓글(Many)은 게시글(One) 하나에 종속된다"
	@JoinColumn(name = "board_id", nullable = false)
	private Board board; // 부모 게시글 상자 연결

	@ManyToOne(fetch = FetchType.LAZY) // ⭐ 관계설정 2: "댓글(Many)은 회원(One) 한 명에 의해 작성된다"
	@JoinColumn(name = "member_id", nullable = false)
	private Member member; // 글쓴이 회원 정보 상자 연결

	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	protected void onCreate() {
		this.createdAt = LocalDateTime.now();
	}

	public void update(String content) {
		this.content = content;
	}
}
