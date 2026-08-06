package com.spaceup.domain.review.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ [프론트 연동] "리뷰" 화면. 의뢰(공사 프로젝트) 1건당 리뷰 1개, 임대인만 작성 가능하고 시공사는 수정/삭제 불가(읽기 전용)
@Entity
@Table(name = "reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Review extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "request_id", nullable = false, unique = true)
	private QuoteRequest request;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "reviewer_id", nullable = false)
	private Member reviewer; // 임대인

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "contractor_id", nullable = false)
	private Member contractor;

	@Column(nullable = false)
	private int rating; // 1~5

	@Column(nullable = false, length = 1000)
	private String content;

	// ⭐ 고정 4종 키워드 중 선택한 것을 콤마 구분 문자열로 저장 (requestedItems/constructionItems와 동일 패턴)
	@Column(length = 200)
	private String keywords;
}
