package com.spaceup.domain.rental.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.YearMonth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.spaceup.domain.rental.exception.RentalApiConfigurationException;

class MolitRentalClientTest {

	private MolitRentalProperties properties;
	private MockRestServiceServer server;
	private MolitRentalClient client;

	@BeforeEach
	void setUp() {
		properties = new MolitRentalProperties();
		properties.setBaseUrl("https://example.test");
		properties.setServiceKey("test-key");
		properties.setNumOfRows(1000);

		RestClient.Builder builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		RestClient restClient = builder
				.baseUrl(properties.getBaseUrl())
				.defaultHeader(HttpHeaders.USER_AGENT, properties.getUserAgent())
				.build();
		client = new MolitRentalClient(restClient, properties, new MolitRentalXmlParser());
	}

	@Test
	void trimsConfiguredServiceKey() {
		properties.setServiceKey("  key-value\n");

		assertThat(properties.requiredServiceKey()).isEqualTo("key-value");
	}

	@Test
	void rejectsMissingServiceKeyWithoutSendingRequest() {
		properties.setServiceKey(" ");

		assertThatThrownBy(() -> client.fetchPage("11110", YearMonth.of(2026, 7), 1))
				.isInstanceOf(RentalApiConfigurationException.class)
				.hasMessageContaining("MOLIT_RENT_API_SERVICE_KEY");
		server.verify();
	}

	@Test
	void sendsRequiredQueryAndParsesResponse() {
		server.expect(requestTo(
				"https://example.test/getRTMSDataSvcAptRent"
						+ "?serviceKey=test-key"
						+ "&LAWD_CD=11110"
						+ "&DEAL_YMD=202607"
						+ "&pageNo=1"
						+ "&numOfRows=1000"))
				.andExpect(header(HttpHeaders.USER_AGENT, properties.getUserAgent()))
				.andRespond(withSuccess(fixture("molit-rental-success.xml"), MediaType.APPLICATION_XML));

		MolitRentalPage page = client.fetchPage("11110", YearMonth.of(2026, 7), 1);

		assertThat(page.totalCount()).isEqualTo(3);
		server.verify();
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
