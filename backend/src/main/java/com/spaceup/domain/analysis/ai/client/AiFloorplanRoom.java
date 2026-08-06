package com.spaceup.domain.analysis.ai.client;

// ⭐ ai 브랜치의 SPA(세그멘테이션) 서비스가 반환하는 rooms[] 항목 중 우리가 실제로 쓰는 필드만 옮겨 담습니다.
// class_id 5=침실/안방, 9=욕실, 8=발코니/베란다 (ai/spa/app/main.py의 ROOM_CLASS_IDS 매핑 기준).
// ⚠️ 픽셀 단위 데이터만 있고 m² 면적은 계산되지 않으므로 면적 관련 필드는 없습니다.
public record AiFloorplanRoom(String roomName, int classId) {

	private static final int CLASS_BEDROOM = 5;
	private static final int CLASS_BATHROOM = 9;
	private static final int CLASS_BALCONY = 8;

	public boolean isBedroom() {
		return classId == CLASS_BEDROOM;
	}

	public boolean isBathroom() {
		return classId == CLASS_BATHROOM;
	}

	public boolean isBalcony() {
		return classId == CLASS_BALCONY;
	}
}
