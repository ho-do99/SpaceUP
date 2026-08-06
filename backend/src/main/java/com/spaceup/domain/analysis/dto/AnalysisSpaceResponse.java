package com.spaceup.domain.analysis.dto;

import com.spaceup.domain.analysis.entity.AnalysisSpace;

public record AnalysisSpaceResponse(Long id, String spaceName, Double spaceAreaM2, Double floorAreaM2,
		Double wallpaperAreaM2, boolean selectedForConstruction, Integer sortOrder) {

	public AnalysisSpaceResponse(AnalysisSpace space) {
		this(space.getId(), space.getSpaceName(), space.getSpaceAreaM2(), space.getFloorAreaM2(),
				space.getWallpaperAreaM2(), space.isSelectedForConstruction(), space.getSortOrder());
	}
}
