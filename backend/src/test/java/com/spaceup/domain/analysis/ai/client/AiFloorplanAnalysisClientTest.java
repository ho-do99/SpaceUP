package com.spaceup.domain.analysis.ai.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.spaceup.domain.analysis.ai.exception.AiFloorplanAnalysisException;

class AiFloorplanAnalysisClientTest {

	private MockRestServiceServer server;
	private AiFloorplanAnalysisClient client;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		client = new AiFloorplanAnalysisClient(builder.baseUrl("https://ai.test").build());
	}

	@Test
	void parsesTotalAreaAndRoomPixelCounts() {
		server.expect(requestTo("https://ai.test/api/analyze"))
				.andRespond(withSuccess("""
						{
						  "total_area_pixel_count": 3000,
						  "rooms": [
						    {"room_name": "거실", "class_id": 4, "pixel_count": 1000,
						     "included_in_total_area": true}
						  ]
						}
						""", MediaType.APPLICATION_JSON));

		AiFloorplanAnalysisResponse response = client.analyze(new byte[] { 1 }, "plan.png", "image/png");

		assertThat(response.totalAreaPixelCount()).isEqualTo(3000);
		assertThat(response.rooms()).containsExactly(new AiFloorplanRoom("거실", 4, 1000, true));
		server.verify();
	}

	@Test
	void rejectsNonPositiveTotalAreaPixelCount() {
		server.expect(requestTo("https://ai.test/api/analyze"))
				.andRespond(withSuccess("""
						{"total_area_pixel_count": 0, "rooms": []}
						""", MediaType.APPLICATION_JSON));

		assertThatThrownBy(() -> client.analyze(new byte[] { 1 }, "plan.png", "image/png"))
				.isInstanceOf(AiFloorplanAnalysisException.class)
				.hasMessageContaining("total_area_pixel_count");
	}

	@Test
	void skipsRoomsWithNonPositivePixelCounts() {
		server.expect(requestTo("https://ai.test/api/analyze"))
				.andRespond(withSuccess("""
						{
						  "total_area_pixel_count": 3000,
						  "rooms": [
						    {"room_name": "오류 공간", "class_id": 4, "pixel_count": 0,
						     "included_in_total_area": true},
						    {"room_name": "거실", "class_id": 4, "pixel_count": 1000,
						     "included_in_total_area": true}
						  ]
						}
						""", MediaType.APPLICATION_JSON));

		AiFloorplanAnalysisResponse response = client.analyze(new byte[] { 1 }, "plan.png", "image/png");

		assertThat(response.rooms()).containsExactly(new AiFloorplanRoom("거실", 4, 1000, true));
	}

	@Test
	void rejectsMissingRoomsArray() {
		server.expect(requestTo("https://ai.test/api/analyze"))
				.andRespond(withSuccess("""
						{"total_area_pixel_count": 3000}
						""", MediaType.APPLICATION_JSON));

		assertThatThrownBy(() -> client.analyze(new byte[] { 1 }, "plan.png", "image/png"))
				.isInstanceOf(AiFloorplanAnalysisException.class)
				.hasMessageContaining("rooms");
	}

	@Test
	void rejectsRoomPixelCountGreaterThanTotal() {
		server.expect(requestTo("https://ai.test/api/analyze"))
				.andRespond(withSuccess("""
						{
						  "total_area_pixel_count": 100,
						  "rooms": [
						    {"room_name": "거실", "class_id": 4, "pixel_count": 101,
						     "included_in_total_area": true}
						  ]
						}
						""", MediaType.APPLICATION_JSON));

		assertThatThrownBy(() -> client.analyze(new byte[] { 1 }, "plan.png", "image/png"))
				.isInstanceOf(AiFloorplanAnalysisException.class)
				.hasMessageContaining("전체 픽셀 수보다 큽니다");
	}

	@Test
	void rejectsMissingRequiredRoomFields() {
		server.expect(requestTo("https://ai.test/api/analyze"))
				.andRespond(withSuccess("""
						{
						  "total_area_pixel_count": 3000,
						  "rooms": [
						    {"room_name": "거실", "pixel_count": 1000,
						     "included_in_total_area": true}
						  ]
						}
						""", MediaType.APPLICATION_JSON));

		assertThatThrownBy(() -> client.analyze(new byte[] { 1 }, "plan.png", "image/png"))
				.isInstanceOf(AiFloorplanAnalysisException.class)
				.hasMessageContaining("누락되었거나 형식이 잘못되었습니다");
	}
}
