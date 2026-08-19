package com.spaceup.global.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;

class FlywayMigrationVersionTest {

	@Test
	void eachMigrationHasAUniqueVersion() throws IOException, URISyntaxException {
		Path migrationDirectory = Path.of(getClass().getResource("/db/migration").toURI());

		Map<MigrationVersion, Long> migrationCountByVersion;
		try (Stream<Path> migrations = Files.list(migrationDirectory)) {
			migrationCountByVersion = migrations
					.map(path -> path.getFileName().toString())
					.filter(name -> name.startsWith("V") && name.endsWith(".sql"))
					.collect(Collectors.groupingBy(
							name -> MigrationVersion.fromVersion(
									name.substring(1, name.indexOf("__"))),
							Collectors.counting()));
		}

		Map<MigrationVersion, Long> duplicates = migrationCountByVersion.entrySet().stream()
				.filter(entry -> entry.getValue() > 1)
				.collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
		assertTrue(duplicates.isEmpty(),
				() -> "Flyway migration versions must be unique: " + duplicates);
	}
}
