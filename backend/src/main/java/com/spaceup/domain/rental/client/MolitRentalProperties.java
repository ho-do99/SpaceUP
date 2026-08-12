package com.spaceup.domain.rental.client;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

import com.spaceup.domain.rental.exception.RentalApiConfigurationException;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "external-api.molit-rental")
public class MolitRentalProperties {

	private String baseUrl = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent";
	private String serviceKey = "";
	private int numOfRows = 1000;
	private Duration connectTimeout = Duration.ofSeconds(5);
	private Duration readTimeout = Duration.ofSeconds(20);
	private String userAgent = "Mozilla/5.0 (compatible; Spaceup/1.0)";

	public String requiredServiceKey() {
		String trimmed = serviceKey == null ? "" : serviceKey.trim();
		if (trimmed.isEmpty()) {
			throw new RentalApiConfigurationException(
					"MOLIT_RENT_API_SERVICE_KEY 환경 변수가 설정되지 않았습니다.");
		}
		return trimmed;
	}
}
