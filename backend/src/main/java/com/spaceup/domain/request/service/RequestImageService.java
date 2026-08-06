package com.spaceup.domain.request.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.request.dto.RequestImageAddRequest;
import com.spaceup.domain.request.dto.RequestImageResponse;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestImage;
import com.spaceup.domain.request.entity.RequestImageType;
import com.spaceup.domain.request.repository.RequestImageRepository;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.RequestNotFoundException;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] 평면도/집 사진을 의뢰에 연결하는 도메인. 이미지 업로드 자체(POST /api/files/images)와는
// 분리되어 있습니다 - 파일 저장은 domain/file이 무상태로 처리하고, "어느 의뢰의 몇 번째 무슨 이미지인지"는
// 여기서 관리합니다(RequestService.md 5번 항목 - C안: 별도 테이블/API).
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RequestImageService {

	private final RequestImageRepository requestImageRepository;
	private final QuoteRequestRepository quoteRequestRepository;

	@Transactional
	public Long addImage(Long requestId, Long landlordId, RequestImageAddRequest dto) {
		QuoteRequest request = findRequestOrThrow(requestId);
		validateOwner(request, landlordId);

		int nextSortOrder = requestImageRepository.countByRequestIdAndImageType(requestId, dto.getImageType());
		RequestImage image = RequestImage.builder().request(request).imageType(dto.getImageType())
				.imageUrl(dto.getImageUrl()).sortOrder(nextSortOrder).build();
		requestImageRepository.save(image);
		request.touch();
		return image.getId();
	}

	// ⭐ type을 안 주면 평면도+집사진 전체를, 주면 해당 타입만 순서대로 반환합니다.
	public List<RequestImageResponse> getImages(Long requestId, RequestImageType imageType) {
		List<RequestImage> images = imageType != null
				? requestImageRepository.findByRequestIdAndImageTypeOrderBySortOrderAsc(requestId, imageType)
				: requestImageRepository.findByRequestIdOrderByImageTypeAscSortOrderAsc(requestId);
		return images.stream().map(RequestImageResponse::new).collect(Collectors.toList());
	}

	@Transactional
	public void deleteImage(Long requestId, Long imageId, Long landlordId) {
		QuoteRequest request = findRequestOrThrow(requestId);
		validateOwner(request, landlordId);

		RequestImage image = requestImageRepository.findById(imageId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 이미지입니다: " + imageId));
		if (!image.getRequest().getId().equals(requestId)) {
			throw new RequestNotFoundException("해당 의뢰에 속한 이미지가 아닙니다: " + imageId);
		}
		requestImageRepository.delete(image);
	}

	private void validateOwner(QuoteRequest request, Long landlordId) {
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰에만 이미지를 추가/삭제할 수 있습니다.");
		}
	}

	private QuoteRequest findRequestOrThrow(Long requestId) {
		return quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
	}
}
