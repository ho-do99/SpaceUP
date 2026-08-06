package com.spaceup.domain.request.entity;

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

import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ [프론트 연동] 의뢰(QuoteRequest)에 첨부되는 평면도/집 사진. domain/file의 이미지 업로드 API가 반환한
// imageUrl을 여기에 연결합니다 - 업로드 자체는 파일 저장만 하고 DB 기록이 없어서(무상태), "어떤 의뢰의 어떤
// 종류 이미지인지 + 몇 번째인지"는 이 테이블이 담당합니다.
@Entity
@Table(name = "request_image")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class RequestImage extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "request_id", nullable = false)
	private QuoteRequest request;

	@Enumerated(EnumType.STRING)
	@Column(name = "image_type", nullable = false, length = 20)
	private RequestImageType imageType;

	@Column(name = "image_url", nullable = false, length = 500)
	private String imageUrl;

	// ⭐ 같은 타입 내에서의 표시 순서 - 등록 시점에 "현재 개수" 기준으로 자동 부여합니다(RequestImageService 참고).
	@Column(name = "sort_order", nullable = false)
	private Integer sortOrder;
}
