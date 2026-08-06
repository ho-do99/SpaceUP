package com.spaceup.domain.analysis.entity;

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

// ⭐ [프론트 연동] "공간 정보 확인" 화면의 방 단위(안방/거실/주방 등) 세부 정보. AnalysisJob : AnalysisSpace
// = 1 : N입니다. PDF의 space_result와 개념은 비슷하지만, 지금은 ML이 공간별 배열을 안 주고 사용자가 직접
// "공간 정보 수정" 화면에서 입력/수정하는 값이라 이름을 다르게 뒀습니다(AnalysisJobService.replaceSpaces 참고).
@Entity
@Table(name = "analysis_space")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AnalysisSpace {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "analysis_id", nullable = false)
	private AnalysisJob analysisJob;

	@Column(name = "space_name", nullable = false, length = 30)
	private String spaceName; // 예: "안방", "거실", "주방"

	@Column(name = "space_area_m2")
	private Double spaceAreaM2; // 공간 면적(㎡)

	@Column(name = "floor_area_m2")
	private Double floorAreaM2; // 공간별 바닥 시공 면적(㎡)

	@Column(name = "wallpaper_area_m2")
	private Double wallpaperAreaM2; // 공간별 벽지 시공 면적(㎡)

	@Builder.Default
	@Column(name = "selected_for_construction", nullable = false)
	private boolean selectedForConstruction = true; // 시공 선택 여부

	@Column(name = "sort_order", nullable = false)
	private Integer sortOrder;
}
