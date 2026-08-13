package com.spaceup.domain.ai.dto;

import java.util.List;

public record InteriorImageStatusResponse(InteriorImageGenerationStatus status, List<String> imageUrls) {
}
