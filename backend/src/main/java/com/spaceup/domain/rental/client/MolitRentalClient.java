package com.spaceup.domain.rental.client;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

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
		// ⭐ UriComponentsBuilder는 RFC 3986 기준으로 쿼리 값을 인코딩하는데, 이 규격에서는 '+'가 그대로
		// 허용되는 문자라 인코딩되지 않는다. 반면 공공데이터포털 서버는 쿼리 파라미터를
		// application/x-www-form-urlencoded 규칙으로 디코딩해서 '+'를 공백으로 해석하므로, 서비스키에
		// '+'가 포함돼 있으면(흔한 base64 키) 조용히 깨져 SERVICE_KEY_IS_NOT_REGISTERED_ERROR가 발생한다.
		// serviceKey만 미리 URLEncoder로 인코딩한 뒤 build(true)(=이미 인코딩됨)로 재인코딩을 막는다.
		String encodedServiceKey = URLEncoder.encode(serviceKey, StandardCharsets.UTF_8);
		try {
			URI uri = UriComponentsBuilder.fromUriString(properties.getBaseUrl())
					.path("/getRTMSDataSvcAptRent")
					.queryParam("serviceKey", encodedServiceKey)
					.queryParam("LAWD_CD", lawdCd)
					.queryParam("DEAL_YMD", dealYm.format(DEAL_YM_FORMAT))
					.queryParam("pageNo", pageNo)
					.queryParam("numOfRows", properties.getNumOfRows())
					.build(true)
					.toUri();
			String xml = restClient.get()
					.uri(uri)
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
