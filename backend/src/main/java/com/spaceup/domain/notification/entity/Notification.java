package com.spaceup.domain.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ PDF "알림센터" 화면. Request/Quote/Schedule 서비스에서 상태가 바뀔 때 이 엔티티를 생성하도록 연동하면 됩니다.
@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Notification extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "receiver_id", nullable = false)
	private Member receiver;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private NotificationType type;

	@Column(nullable = false, length = 100)
	private String title;

	@Column(length = 300)
	private String content;

	// ⭐ [트러블슈팅 반영] 컬럼명을 명시 안 하면 필드명 그대로 'read' 컬럼이 되는데, READ는 MySQL
	// 예약어라 create table 자체가 실패합니다. 컬럼명만 is_read로 지정해서 충돌을 피했습니다.
	// (자바 필드명은 그대로 read라 Repository/Service 코드는 안 건드려도 됩니다)
	@Builder.Default
	@Column(name = "is_read", nullable = false)
	private boolean read = false;

	public void markAsRead() {
		this.read = true;
	}
}
