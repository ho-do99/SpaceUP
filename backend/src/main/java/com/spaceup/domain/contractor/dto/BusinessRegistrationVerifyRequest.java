package com.spaceup.domain.contractor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BusinessRegistrationVerifyRequest {

	@NotBlank(message = "사업자등록번호를 입력해 주세요.")
	private String businessRegistrationNumber;
}
