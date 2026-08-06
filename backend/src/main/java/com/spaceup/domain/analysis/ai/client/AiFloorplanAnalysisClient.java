package com.spaceup.domain.analysis.ai.client;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.spaceup.domain.analysis.ai.exception.AiFloorplanAnalysisException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

// ⭐ [AI/OCR 연동] origin/ai 브랜치의 viewerwall 서비스(포트 8004) POST /api/analyze를 호출합니다.
// 이 서비스는 SPA(세그멘테이션) + OCR을 합쳐 rooms[]를 픽셀 단위로 반환합니다 - m² 면적은 없습니다.
@Component
public class AiFloorplanAnalysisClient {

	private final RestClient restClient;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public AiFloorplanAnalysisClient(@Qualifier("aiFloorplanRestClient") RestClient restClient) {
		this.restClient = restClient;
	}

	public List<AiFloorplanRoom> analyze(byte[] imageBytes, String filename, String contentType) {
		MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
		ByteArrayResource fileResource = new ByteArrayResource(imageBytes) {
			@Override
			public String getFilename() {
				return filename;
			}
		};
		body.add("file", fileResource);

		try {
			String responseJson = restClient.post().uri("/api/analyze")
					.contentType(MediaType.MULTIPART_FORM_DATA).body(body).retrieve().body(String.class);
			return parseRooms(responseJson);
		} catch (RestClientException e) {
			throw new AiFloorplanAnalysisException("AI 평면도 분석 서비스 호출에 실패했습니다.", e);
		} catch (tools.jackson.core.JacksonException e) {
			throw new AiFloorplanAnalysisException("AI 평면도 분석 응답 파싱에 실패했습니다.", e);
		}
	}

	private List<AiFloorplanRoom> parseRooms(String responseJson) {
		JsonNode root = objectMapper.readTree(responseJson);
		List<AiFloorplanRoom> rooms = new ArrayList<>();
		for (JsonNode room : root.path("rooms")) {
			String roomName = room.path("room_name").asString(null);
			int classId = room.path("class_id").asInt(0);
			if (roomName != null) {
				rooms.add(new AiFloorplanRoom(roomName, classId));
			}
		}
		return rooms;
	}
}
