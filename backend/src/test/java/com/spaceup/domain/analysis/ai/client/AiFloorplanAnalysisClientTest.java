package com.spaceup.domain.analysis.ai.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpMethod;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
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
	void sendsPngAsTypedMultipartFilePart() {
		server.expect(requestTo("https://ai.test/api/analyze"))
				.andExpect(method(HttpMethod.POST))
				.andExpect(request -> {
					String body = ((MockClientHttpRequest) request).getBodyAsString(StandardCharsets.ISO_8859_1);
					assertThat(body).contains("filename=\"plan.png\"");
					assertThat(body).contains("Content-Type: image/png");
				})
				.andRespond(withSuccess("""
						{"total_area_pixel_count": 100, "rooms": [
						  {"room_name": "??", "class_id": 4, "pixel_count": 100, "included_in_total_area": true}
						]}
						""", MediaType.APPLICATION_JSON));

		client.analyze(new byte[] { 1 }, "folder/plan.png", "image/png");
		server.verify();
	}

	@Test
	void rejectsUnsupportedMediaTypeBeforeCallingAi() {
		assertThatThrownBy(() -> client.analyze(new byte[] { 1 }, "plan.webp", "image/webp"))
				.isInstanceOf(AiFloorplanAnalysisException.class)
				.hasMessageContaining("PNG")
				.hasMessageContaining("JPEG");
		server.verify();
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
	void prefersOcrDisplayNameOverInternalClassName() {
		server.expect(requestTo("https://ai.test/api/analyze"))
				.andRespond(withSuccess("""
						{
						  "total_area_pixel_count": 3000,
						  "rooms": [
						    {"room_name": "class_4_1", "display_name": "거실", "class_id": 4,
						     "pixel_count": 1000, "included_in_total_area": true}
						  ]
						}
						""", MediaType.APPLICATION_JSON));

		AiFloorplanAnalysisResponse response = client.analyze(new byte[] { 1 }, "plan.png", "image/png");

		assertThat(response.rooms()).containsExactly(new AiFloorplanRoom("거실", 4, 1000, true));
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

	@Test
	void acceptsExcludedRoomPixelCountGreaterThanIncludedAreaTotal() {
		server.expect(requestTo("https://ai.test/api/analyze"))
				.andRespond(withSuccess("""
						{
						  "total_area_pixel_count": 100,
						  "rooms": [
						    {"room_name": "거실", "class_id": 4, "pixel_count": 100,
						     "included_in_total_area": true},
						    {"room_name": "발코니", "class_id": 8, "pixel_count": 150,
						     "included_in_total_area": false}
						  ]
						}
						""", MediaType.APPLICATION_JSON));

		AiFloorplanAnalysisResponse response = client.analyze(new byte[] { 1 }, "plan.png", "image/png");

		assertThat(response.rooms()).hasSize(2);
		assertThat(response.rooms().get(1).includedInTotalArea()).isFalse();
	}

	@Test
	void convertsEmptyAiResponseBodyToDomainException() {
		server.expect(requestTo("https://ai.test/api/analyze"))
				.andRespond(withStatus(HttpStatus.NO_CONTENT));

		assertThatThrownBy(() -> client.analyze(new byte[] { 1 }, "plan.png", "image/png"))
				.isInstanceOf(AiFloorplanAnalysisException.class)
				.hasMessageContaining("비어 있습니다");
	}
}
