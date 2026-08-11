package com.spaceup.domain.analysis.ai.client;

import java.util.List;

public record AiFloorplanAnalysisResponse(long totalAreaPixelCount, List<AiFloorplanRoom> rooms) {
}
