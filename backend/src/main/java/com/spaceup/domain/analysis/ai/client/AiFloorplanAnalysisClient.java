package com.spaceup.domain.analysis.ai.client;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
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

	public AiFloorplanAnalysisResponse analyze(byte[] imageBytes, String filename, String contentType) {
		String safeFilename = safeFilename(filename);
		MediaType imageMediaType = resolveImageMediaType(safeFilename, contentType);
		MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
		ByteArrayResource fileResource = new ByteArrayResource(imageBytes) {
			@Override
			public String getFilename() {
				return safeFilename;
			}
		};
		HttpHeaders fileHeaders = new HttpHeaders();
		fileHeaders.setContentType(imageMediaType);
		fileHeaders.setContentDisposition(ContentDisposition.formData().name("file").filename(safeFilename).build());
		body.add("file", new HttpEntity<>(fileResource, fileHeaders));

		try {
			String responseJson = restClient.post().uri("/api/analyze")
					.contentType(MediaType.MULTIPART_FORM_DATA).body(body).retrieve().body(String.class);
			if (responseJson == null || responseJson.isBlank()) {
				throw new AiFloorplanAnalysisException("AI 평면도 분석 응답 본문이 비어 있습니다.");
			}
			return parseRooms(responseJson);
		} catch (RestClientException e) {
			throw new AiFloorplanAnalysisException("AI 평면도 분석 서비스 호출에 실패했습니다.", e);
		} catch (tools.jackson.core.JacksonException e) {
			throw new AiFloorplanAnalysisException("AI 평면도 분석 응답 파싱에 실패했습니다.", e);
		}
	}

	private String safeFilename(String filename) {
		String normalized = filename == null ? "" : filename.replace('\\', '/');
		String basename = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
		if (basename.isEmpty() || basename.indexOf('\r') >= 0 || basename.indexOf('\n') >= 0) {
			throw new AiFloorplanAnalysisException("AI 분석용 파일 이름이 올바르지 않습니다.");
		}
		return basename;
	}

	private MediaType resolveImageMediaType(String filename, String contentType) {
		String normalizedType = contentType == null ? "" : contentType.trim().toLowerCase();
		String lowerFilename = filename.toLowerCase();
		if (MediaType.IMAGE_PNG_VALUE.equals(normalizedType)
				|| (normalizedType.isEmpty() && lowerFilename.endsWith(".png"))) {
			return MediaType.IMAGE_PNG;
		}
		if (MediaType.IMAGE_JPEG_VALUE.equals(normalizedType)
				|| (normalizedType.isEmpty()
						&& (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")))) {
			return MediaType.IMAGE_JPEG;
		}
		throw new AiFloorplanAnalysisException("AI 평면도 분석은 PNG 또는 JPEG 이미지만 지원합니다.");
	}

	private AiFloorplanAnalysisResponse parseRooms(String responseJson) {
		JsonNode root = objectMapper.readTree(responseJson);
		if (!root.isObject()) {
			throw new AiFloorplanAnalysisException("AI 응답은 JSON 객체여야 합니다.");
		}

		JsonNode totalNode = root.get("total_area_pixel_count");
		if (totalNode == null || !totalNode.isIntegralNumber()) {
			throw new AiFloorplanAnalysisException("AI 응답에 정수 total_area_pixel_count가 필요합니다.");
		}
		long totalAreaPixelCount = totalNode.asLong();
		if (totalAreaPixelCount <= 0) {
			throw new AiFloorplanAnalysisException("AI 응답의 total_area_pixel_count는 0보다 커야 합니다.");
		}

		JsonNode roomsNode = root.get("rooms");
		if (roomsNode == null || !roomsNode.isArray()) {
			throw new AiFloorplanAnalysisException("AI 응답에 rooms 배열이 필요합니다.");
		}

		List<AiFloorplanRoom> rooms = new ArrayList<>();
		for (JsonNode room : roomsNode) {
			if (!room.isObject()) {
				throw new AiFloorplanAnalysisException("AI 응답의 rooms 항목은 JSON 객체여야 합니다.");
			}
			JsonNode roomNameNode = room.get("room_name");
			JsonNode classIdNode = room.get("class_id");
			JsonNode pixelCountNode = room.get("pixel_count");
			JsonNode includedNode = room.get("included_in_total_area");
			if (roomNameNode == null || !roomNameNode.isTextual() || roomNameNode.asString().isBlank()
					|| classIdNode == null || !classIdNode.isIntegralNumber()
					|| pixelCountNode == null || !pixelCountNode.isIntegralNumber()
					|| includedNode == null || !includedNode.isBoolean()) {
				throw new AiFloorplanAnalysisException("AI 응답의 방 필드가 누락되었거나 형식이 잘못되었습니다.");
			}

			String roomName = resolveDisplayName(room, roomNameNode.asString());
			long pixelCount = pixelCountNode.asLong();
			boolean includedInTotalArea = includedNode.asBoolean();
			if (pixelCount <= 0) {
				continue;
			}
			if (includedInTotalArea && pixelCount > totalAreaPixelCount) {
				throw new AiFloorplanAnalysisException("AI 응답의 방 pixel_count가 전체 픽셀 수보다 큽니다: " + roomName);
			}
			rooms.add(new AiFloorplanRoom(roomName, classIdNode.asInt(), pixelCount, includedInTotalArea));
		}
		if (rooms.isEmpty()) {
			throw new AiFloorplanAnalysisException("AI 응답에서 유효한 방을 찾을 수 없습니다.");
		}
		return new AiFloorplanAnalysisResponse(totalAreaPixelCount, List.copyOf(rooms), responseJson);
	}

	private String resolveDisplayName(JsonNode room, String roomName) {
		JsonNode displayNameNode = room.get("display_name");
		if (displayNameNode != null && displayNameNode.isTextual()) {
			String displayName = displayNameNode.asString().trim();
			if (!displayName.isBlank() && !displayName.toLowerCase().startsWith("class_")) {
				return displayName;
			}
		}
		return roomName.trim();
	}
}
