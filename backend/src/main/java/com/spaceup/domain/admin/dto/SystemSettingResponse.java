package com.spaceup.domain.admin.dto;

import com.spaceup.domain.admin.entity.SystemSetting;

import lombok.Getter;

@Getter
public class SystemSettingResponse {
	private final String settingKey;
	private final String settingValue;
	private final String description;

	public SystemSettingResponse(SystemSetting setting) {
		this.settingKey = setting.getSettingKey();
		this.settingValue = setting.getSettingValue();
		this.description = setting.getDescription();
	}
}
