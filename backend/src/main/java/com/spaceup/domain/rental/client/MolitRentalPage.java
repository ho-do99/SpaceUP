package com.spaceup.domain.rental.client;

import java.util.List;

public record MolitRentalPage(
		int pageNo,
		int numOfRows,
		int totalCount,
		List<MolitRentalItem> items) {

	public MolitRentalPage {
		items = List.copyOf(items);
	}
}
