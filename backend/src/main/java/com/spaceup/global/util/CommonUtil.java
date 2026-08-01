package com.spaceup.global.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;

@Component // ⚙️ 의미: "스프링 부트 공장아, 이 도구 상자를 언제든 다른 방에서 꺼내 쓸 수 있게 메모리에 올려둬라!"
public class CommonUtil {

	// ⭐ 날짜 변환 도구: DB에서 가져온 날짜(LocalDateTime)를 우리가 읽기 쉬운 이쁜 텍스트 포맷으로 번역해 줍니다.
	public String formatDateTime(LocalDateTime dateTime) {
		if (dateTime == null) {
			return "";
		}
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
		return dateTime.format(formatter); // 예: 2026-07-13 15:30:00 형태로 리턴
	}

	// ⭐ 문자열 검증 도구: 글자가 비어있거나 띄어쓰기만 들어왔는지 한 방에 체크해 줍니다.
	public boolean isEmpty(String str) {
		return str == null || str.trim().isEmpty();
	}
}
