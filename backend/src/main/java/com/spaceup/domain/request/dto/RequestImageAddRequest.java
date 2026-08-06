package com.spaceup.domain.request.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import com.spaceup.domain.request.entity.RequestImageType;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [프론트 연동] 이미지 업로드 API(POST /api/files/images)가 돌려준 imageUrl을 이 API로 의뢰에 연결합니다.
@Getter
@Setter
@NoArgsConstructor
public class RequestImageAddRequest {

	@NotNull(message = "이미지 종류(imageType)는 필수 입력 사항입니다.")
	private RequestImageType imageType;

	@NotBlank(message = "imageUrl은 필수 입력 사항입니다.")
	private String imageUrl;
}
