package com.spaceup.domain.rental.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import com.spaceup.domain.rental.exception.RentalApiException;

class MolitRentalXmlParserTest {

	private final MolitRentalXmlParser parser = new MolitRentalXmlParser();

	@Test
	void parsesPageMetadataAndPreservesUnknownFields() {
		MolitRentalPage page = parser.parse(fixture("molit-rental-success.xml"));

		assertThat(page.pageNo()).isEqualTo(1);
		assertThat(page.numOfRows()).isEqualTo(2);
		assertThat(page.totalCount()).isEqualTo(3);
		assertThat(page.items()).hasSize(2);
		assertThat(page.items().getFirst().value("deposit")).isEqualTo("12,000");
		assertThat(page.items().getFirst().value("futureField")).isEqualTo("preserved");
	}

	@Test
	void rejectsNonSuccessBusinessCode() {
		assertThatThrownBy(() -> parser.parse(fixture("molit-rental-error.xml")))
				.isInstanceOf(RentalApiException.class)
				.hasMessageContaining("30")
				.hasMessageContaining("SERVICE KEY IS NOT REGISTERED ERROR");
	}

	@Test
	void rejectsDoctype() {
		String unsafeXml = """
				<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]>
				<x>&e;</x>
				""";

		assertThatThrownBy(() -> parser.parse(unsafeXml))
				.isInstanceOf(RentalApiException.class);
	}

	private String fixture(String fileName) {
		try (var input = getClass().getResourceAsStream("/rental/" + fileName)) {
			if (input == null) {
				throw new IllegalArgumentException("테스트 XML 파일을 찾을 수 없습니다: " + fileName);
			}
			return new String(input.readAllBytes(), StandardCharsets.UTF_8);
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}
}
