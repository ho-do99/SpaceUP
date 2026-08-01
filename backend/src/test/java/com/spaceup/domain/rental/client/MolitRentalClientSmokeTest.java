package com.spaceup.domain.rental.client;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.YearMonth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.web.client.RestClient;

@EnabledIfEnvironmentVariable(
		named = "RUN_MOLIT_API_SMOKE",
		matches = "true")
@EnabledIfEnvironmentVariable(
		named = "MOLIT_RENT_API_SERVICE_KEY",
		matches = ".+")
class MolitRentalClientSmokeTest {

	@Test
	void callsOfficialApiAndParsesCurrentSchema() {
		MolitRentalProperties properties = new MolitRentalProperties();
		properties.setServiceKey(
				System.getenv("MOLIT_RENT_API_SERVICE_KEY").trim());
		RestClient restClient = new MolitRentalClientConfig()
				.molitRentalRestClient(properties);
		MolitRentalClient client = new MolitRentalClient(
				restClient, properties, new MolitRentalXmlParser());

		MolitRentalPage page =
				client.fetchPage("11110", YearMonth.of(2026, 7), 1);

		assertThat(page.totalCount()).isGreaterThanOrEqualTo(0);
		assertThat(page.items()).isNotEmpty();
		assertThat(page.items()).allSatisfy(item ->
				assertThat(item.fields())
						.containsKeys("aptNm", "sggCd", "dealYear"));
	}
}
