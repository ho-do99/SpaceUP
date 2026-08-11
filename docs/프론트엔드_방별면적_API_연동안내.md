# 프론트엔드 방별 면적 API 연동 안내

## 변경 내용

AI 평면도 분석 시 사용자 요청에 저장된 전용면적과 방별 세그멘테이션 픽셀 비율로 방 면적을 자동 계산합니다.

```text
방 면적(㎡) = 전용면적(㎡) × 방 픽셀 수 ÷ 전체 실내 픽셀 수
```

예: 전용면적 84㎡, 전체 3000픽셀, 거실 1000픽셀이면 거실은 28㎡입니다.

## 프론트엔드 사용 API

AI 분석 이후 다음 API로 공간 목록을 조회합니다.

```http
GET /api/analysis/request/{requestId}/spaces
```

응답의 `spaceAreaM2`가 자동 계산된 방 면적입니다.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "spaceName": "거실",
      "spaceAreaM2": 28.0,
      "floorAreaM2": 28.0,
      "wallpaperAreaM2": null,
      "selectedForConstruction": true
    }
  ]
}
```

## 표시 방법

평 단위는 API에 별도로 저장하지 않습니다. 프론트엔드에서 다음과 같이 변환합니다.

```ts
const areaPyeong = space.spaceAreaM2 / 3.305785
```

권장 표시 예시는 `거실 28㎡ (8.47평)`입니다. 여러 방을 선택하면 선택된 항목의 `spaceAreaM2`를 합산한 뒤 평으로 변환합니다. 계산 중간값은 반올림하지 않고 화면에 표시할 때만 소수점 둘째 자리로 반올림해주세요.

## 주의사항

- 프론트엔드는 AI의 `pixel_count`를 직접 계산하거나 전달하지 않습니다.
- 면적 계산은 백엔드가 담당하므로 `spaceAreaM2`를 기준값으로 사용합니다.
- AI 분석이 끝난 뒤 공간 조회 API를 호출해야 계산된 값이 제공됩니다.
