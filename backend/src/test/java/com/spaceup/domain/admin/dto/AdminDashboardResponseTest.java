package com.spaceup.domain.admin.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;

import org.junit.jupiter.api.Test;

class AdminDashboardResponseTest {

	@Test
	void dashboardContractContainsOnlyCurrentMemberRoles() {
		AdminDashboardResponse response = new AdminDashboardResponse(7, 3, 1, 5, 2);

		assertThat(response.totalLandlords()).isEqualTo(7);
		assertThat(response.totalContractors()).isEqualTo(3);
		assertThat(response.pendingContractorApprovals()).isEqualTo(1);
		assertThat(response.totalRequests()).isEqualTo(5);
		assertThat(response.pendingSettlements()).isEqualTo(2);
		assertThat(Arrays.stream(AdminDashboardResponse.class.getRecordComponents())
				.map(component -> component.getName()))
				.containsExactly("totalLandlords", "totalContractors", "pendingContractorApprovals",
						"totalRequests", "pendingSettlements");
	}
}
