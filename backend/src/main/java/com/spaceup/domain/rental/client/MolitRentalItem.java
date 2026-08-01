package com.spaceup.domain.rental.client;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public record MolitRentalItem(Map<String, String> fields) {

	public MolitRentalItem {
		fields = Collections.unmodifiableMap(new LinkedHashMap<>(fields));
	}

	public String value(String name) {
		return fields.get(name);
	}
}
