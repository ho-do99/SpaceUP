package com.spaceup.global.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

/**
 * ⭐ 공통 Base 엔티티: 모든 신규 도메인(Request, Quote, Product, Order ...)이 상속받아
 * createdAt/updatedAt을 중복 선언 없이 자동으로 갖도록 합니다. board_backup/member는 기존 코드를
 * 건드리지 않기 위해 그대로 두고, 이후 새로 추가되는 도메인부터 이 클래스를 사용합니다.
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseTimeEntity {

	@CreatedDate
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@LastModifiedDate
	@Column(name = "updated_at")
	private LocalDateTime updatedAt;
}
