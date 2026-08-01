package com.spaceup.global.error;

// ⭐ DB에 시스템 설정(SystemSetting) 키가 존재하지 않을 때 터트릴 전용 에러입니다.
public class SettingNotFoundException extends RuntimeException {
	public SettingNotFoundException(String message) {
		super(message);
	}
}
