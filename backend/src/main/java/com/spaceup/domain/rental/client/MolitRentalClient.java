package com.spaceup.domain.rental.client;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.spaceup.domain.rental.exception.RentalApiException;

@Component
public class MolitRentalClient {

	private static final DateTimeFormatter DEAL_YM_FORMAT = DateTimeFormatter.ofPattern("yyyyMM");

	private final RestClient restClient;
	private final MolitRentalProperties properties;
	private final MolitRentalXmlParser parser;

	public MolitRentalClient(
			@Qualifier("molitRentalRestClient") RestClient restClient,
			MolitRentalProperties properties,
			MolitRentalXmlParser parser) {
		this.restClient = restClient;
		this.properties = properties;
		this.parser = parser;
	}

	public MolitRentalPage fetchPage(String lawdCd, YearMonth dealYm, int pageNo) {
		String serviceKey = properties.requiredServiceKey();
		try {
			String xml = restClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/getRTMSDataSvcAptRent")
							.queryParam("serviceKey", serviceKey)
							.queryParam("LAWD_CD", lawdCd)
							.queryParam("DEAL_YMD", dealYm.format(DEAL_YM_FORMAT))
							.queryParam("pageNo", pageNo)
							.queryParam("numOfRows", properties.getNumOfRows())
							.build())
					.retrieve()
					.body(String.class);
			return parser.parse(xml);
		} catch (RentalApiException e) {
			throw e;
		} catch (RestClientException e) {
			throw new RentalApiException(
					"국토교통부 전월세 API 호출에 실패했습니다.", e);
		}
	}
}
