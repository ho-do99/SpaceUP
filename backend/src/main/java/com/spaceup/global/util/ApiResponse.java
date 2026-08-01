package com.spaceup.global.util;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ApiResponse<T> {
	private boolean success; // 성공 여부 (true/false)
	private String message; // 한글 안내 문구
	private T data; // 실제 데이터 주머니

	// ⭐ 교정 포인트: Swagger 엔진이 리플렉션 분석 시 무한 루프 오류(500)를 일으키지 않도록 타입을 정확하게 고정 정렬했습니다.
	public static <T> ApiResponse<T> success(String message, T data) {
		ApiResponse<T> res = new ApiResponse<>();
		res.success = true;
		res.message = message;
		res.data = data;
		return res;
	}

	public static <T> ApiResponse<T> fail(String message) {
		ApiResponse<T> res = new ApiResponse<>();
		res.success = false;
		res.message = message;
		res.data = null;
		return res;
	}
}
