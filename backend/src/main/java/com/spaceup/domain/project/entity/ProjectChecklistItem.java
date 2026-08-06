package com.spaceup.domain.project.entity;

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

// ⭐ [프론트 연동] ContractorProjectChecklistItem 대응 - 시공사가 진행 단계에 맞춰 자유롭게 추가/체크
@Entity
@Table(name = "project_checklist_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ProjectChecklistItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "project_id", nullable = false)
	private ContractorProject project;

	@Column(nullable = false, length = 100)
	private String label;

	@Builder.Default
	@Column(nullable = false)
	private boolean completed = false;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	void assignProject(ContractorProject project) {
		this.project = project;
	}

	public void setCompleted(boolean completed) {
		this.completed = completed;
	}
}
