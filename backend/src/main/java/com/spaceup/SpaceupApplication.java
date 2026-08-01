package com.spaceup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// ⭐ [최종 검토 반영] @EnableScheduling을 추가했습니다. 이게 없으면
// domain/request/service/RequestAutoCancelScheduler의 @Scheduled 메서드가 절대 실행되지 않습니다.
@EnableScheduling
@SpringBootApplication
public class SpaceupApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpaceupApplication.class, args);
	}

}
