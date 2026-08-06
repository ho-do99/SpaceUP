package com.spaceup.domain.request.dto;

import com.spaceup.domain.request.entity.RequestImage;
import com.spaceup.domain.request.entity.RequestImageType;

public record RequestImageResponse(Long id, RequestImageType imageType, String imageUrl, Integer sortOrder) {

	public RequestImageResponse(RequestImage image) {
		this(image.getId(), image.getImageType(), image.getImageUrl(), image.getSortOrder());
	}
}
