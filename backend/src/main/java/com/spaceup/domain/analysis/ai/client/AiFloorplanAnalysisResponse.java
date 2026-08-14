package com.spaceup.domain.analysis.ai.client;

import java.util.List;

public record AiFloorplanAnalysisResponse(long totalAreaPixelCount, List<AiFloorplanRoom> rooms,
		String visualizationJson) {
	public AiFloorplanAnalysisResponse(long totalAreaPixelCount, List<AiFloorplanRoom> rooms) {
		this(totalAreaPixelCount, rooms, null);
	}
}
