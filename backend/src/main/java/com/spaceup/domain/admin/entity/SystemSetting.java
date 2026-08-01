package com.spaceup.domain.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * ⭐ PDF "시스템설정(관리자)" 화면. key-value 방식의 범용 설정 저장소입니다. 지금은 수수료율 하나만 쓰지만,
 * 점검모드/노출정책 등이 추가돼도 테이블 스키마를 안 건드리고 row만 추가하면 되게 설계했습니다.
 */
@Entity
@Table(name = "system_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SystemSetting extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "setting_key", nullable = false, unique = true, length = 50)
	private String settingKey; // 예: "COMMISSION_RATE"

	@Column(name = "setting_value", nullable = false, length = 100)
	private String settingValue; // 예: "0.10" (문자열로 저장, 사용하는 쪽에서 파싱)

	@Column(length = 200)
	private String description;

	public void updateValue(String settingValue) {
		this.settingValue = settingValue;
	}
}
