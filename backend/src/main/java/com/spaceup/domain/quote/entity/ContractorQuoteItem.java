package com.spaceup.domain.quote.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ PDF "견적 항목" 리스트(철거/바닥/조명 각각 금액이 다른 줄 항목들)
// ⭐ [DB 명칭 정합화] DB팀 명세의 contractor_quote_item에 클래스명/테이블/PK/컬럼명을 맞췄습니다
// (QuoteItem→ContractorQuoteItem, category→work_type).
@Entity
@Table(name = "contractor_quote_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ContractorQuoteItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "quote_item_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "quote_id", nullable = false)
	private ContractorQuote quote;

	@Column(name = "work_type", nullable = false, length = 30)
	private String category; // 철거/바닥/조명 등

	@Column(length = 100)
	private String description; // 어반톤 9T, LED 교체 등 세부 내용

	@Column(nullable = false)
	private Long amount; // 항목 금액

	void assignQuote(ContractorQuote quote) {
		this.quote = quote;
	}
}
