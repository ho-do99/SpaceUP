package com.spaceup.domain.project.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.quote.entity.ContractorQuote;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.global.entity.BaseTimeEntity;
import com.spaceup.global.error.InvalidStatusTransitionException;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ [프론트 연동] "공사 진행률" 화면(ContractorProject). 견적이 수락(ContractorQuote.ACCEPTED)된 뒤
// 시공사가 "계약 전환"하면 생성되며, 실제 프론트의 착공·완공 일정과 체크리스트/단계별 진행 화면을 담당합니다.
@Entity
@Table(name = "contractor_projects")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ContractorProject extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "request_id", nullable = false, unique = true)
	private QuoteRequest request;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "quote_id", nullable = false, unique = true)
	private ContractorQuote quote;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ProjectStatus status;

	private LocalDate contractDate;
	private Long contractAmount;

	private LocalDate startDate;
	private LocalDate completionDate;

	@Column(length = 200)
	private String constructionItems; // 콤마 구분, 예: "바닥,도배,조명"

	@Column(length = 500)
	private String customerRequest;

	@Builder.Default
	@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	private List<ProjectChecklistItem> checklist = new ArrayList<>();

	public void addChecklistItem(ProjectChecklistItem item) {
		checklist.add(item);
		item.assignProject(this);
	}

	// ⭐ [Figma 반영] "일정 변경" 다이얼로그 - 변경 전/후 값을 서비스 레이어가 응답에 실어줄 수 있도록 이전 값을 반환
	public void updateSchedule(LocalDate startDate, LocalDate completionDate) {
		this.startDate = startDate;
		this.completionDate = completionDate;
	}

	public void start() {
		if (status != ProjectStatus.VISIT_SCHEDULED && status != ProjectStatus.START_SCHEDULED) {
			throw new InvalidStatusTransitionException(
					String.format("현재 상태(%s)에서는 착공할 수 없습니다.", status));
		}
		this.status = ProjectStatus.IN_PROGRESS;
	}

	public void requestCompletion() {
		validateStatus(ProjectStatus.IN_PROGRESS);
		this.status = ProjectStatus.COMPLETION_REQUESTED;
	}

	public void confirmCompletion() {
		validateStatus(ProjectStatus.COMPLETION_REQUESTED);
		this.status = ProjectStatus.COMPLETED;
	}

	private void validateStatus(ProjectStatus expected) {
		if (this.status != expected) {
			throw new InvalidStatusTransitionException(
					String.format("현재 상태(%s)에서는 처리할 수 없습니다. 예상 상태: %s", this.status, expected));
		}
	}
}
