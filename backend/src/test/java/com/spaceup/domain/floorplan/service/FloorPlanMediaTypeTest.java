package com.spaceup.domain.floorplan.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class FloorPlanMediaTypeTest {

	@Test
	void resolvesRegisteredFloorPlanContentTypeFromObjectKey() {
		assertThat(ApartmentService.resolveImageMediaType("floorplans/plan.png")).isEqualTo(MediaType.IMAGE_PNG);
		assertThat(ApartmentService.resolveImageMediaType("floorplans/plan.jpg")).isEqualTo(MediaType.IMAGE_JPEG);
		assertThat(ApartmentService.resolveImageMediaType("floorplans/plan.jpeg")).isEqualTo(MediaType.IMAGE_JPEG);
		assertThat(ApartmentService.resolveImageMediaType("floorplans/plan.webp").toString()).isEqualTo("image/webp");
	}
}
