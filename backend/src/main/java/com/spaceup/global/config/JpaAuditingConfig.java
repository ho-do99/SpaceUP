package com.spaceup.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// ⭐ BaseTimeEntity의 @CreatedDate / @LastModifiedDate가 동작하려면 Auditing을 켜줘야 합니다.
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
