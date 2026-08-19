package com.spaceup.global.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import com.spaceup.domain.notification.entity.NotificationType;

class NotificationTypeMigrationTest {

	@Test
	void latestMigrationAllowsEveryApplicationNotificationType() throws IOException {
		String migration;
		try (var input = getClass().getResourceAsStream(
				"/db/migration/V11__expand_notification_types.sql")) {
			assertThat(input).as("V11 notification enum migration").isNotNull();
			migration = new String(input.readAllBytes(), StandardCharsets.UTF_8);
		}

		assertThat(migration).contains("ALTER TABLE notifications", "MODIFY COLUMN type ENUM");
		for (NotificationType type : NotificationType.values()) {
			assertThat(migration).as("migration enum contains %s", type)
					.contains("'" + type.name() + "'");
		}
	}
}
