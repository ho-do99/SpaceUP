package com.spaceup.domain.board_backup.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "upload_files")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UploadFile {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "upload_file_name", nullable = false)
	private String uploadFileName; // 사용자가 올린 원래 파일명 (예: image.png)

	@Column(name = "store_file_name", nullable = false, unique = true)
	private String storeFileName; // 서버 하드디스크에 중복 없이 저장될 파일명 (UUID 적용용)

	@Column(name = "file_size", nullable = false)
	private Long fileSize; // 파일 용량 (Byte 단위)

	@ManyToOne(fetch = FetchType.LAZY) // ⭐ 1:N 관계 맵핑: 게시글 하나에 여러 첨부파일이 붙을 수 있습니다.
	@JoinColumn(name = "board_id", nullable = false)
	private Board board; // 이 파일이 첨부되어 있는 부모 게시글 상자 연결

	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	protected void onCreate() {
		this.createdAt = LocalDateTime.now();
	}
}
