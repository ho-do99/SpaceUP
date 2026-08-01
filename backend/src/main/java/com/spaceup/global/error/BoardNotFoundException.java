package com.spaceup.global.error;

// ⭐ 조회하려는 게시글이 이미 삭제되었거나 존재하지 않을 때 터트릴 전용 에러 파일입니다.
public class BoardNotFoundException extends RuntimeException {
	public BoardNotFoundException(String message) {
		super(message);
	}
}
