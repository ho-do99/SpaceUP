# 평면도 방별 면적 계산 설계

## 목표

AI 세그멘테이션 결과의 방별 픽셀 수와 사용자가 입력한 전용면적을 이용해 방별 면적을 계산하고, 기존 `AnalysisSpace.spaceAreaM2`에 저장해 프론트엔드가 조회할 수 있게 한다.

## 범위

- AI `room_json` 응답에 전용면적 기준 실내 마스크의 합집합 픽셀 수인 `total_area_pixel_count`를 추가한다.
- 기존 `rooms[].pixel_count`와 나머지 응답 필드는 유지한다.
- 백엔드는 AI 응답의 `total_area_pixel_count`와 `rooms[].pixel_count`를 파싱한다.
- 백엔드는 요청의 `Property.exclusiveAreaM2`를 기준으로 방별 `spaceAreaM2`를 계산하고 저장한다.
- 계산 결과는 기존 공간 조회 API의 `spaceAreaM2`로 제공한다.
- 프론트엔드 코드는 변경하지 않고 연동 규격을 문서로 전달한다.

## AI 픽셀 기준

`total_area_pixel_count`는 이미지 전체 픽셀 수가 아니다. 전용면적에 대응하는 실내 공간들의 최종 세그멘테이션 마스크를 동일 해상도에서 합집합 처리한 뒤 센 픽셀 수다. 배경과 전용면적에서 제외되는 클래스는 포함하지 않으며, 겹치는 픽셀은 한 번만 센다.

응답 예시는 다음과 같다.

```json
{
  "image_width": 1200,
  "image_height": 900,
  "total_area_pixel_count": 3000,
  "rooms": [
    {
      "instance_id": 1,
      "room_name": "거실",
      "class_id": 4,
      "pixel_count": 1000,
      "included_in_total_area": true
    }
  ]
}
```

## 백엔드 계산

방별 면적은 다음 식으로 계산한다.

```text
spaceAreaM2 = exclusiveAreaM2 * roomPixelCount / totalAreaPixelCount
```

`included_in_total_area=false`인 발코니(class 8)와 실외기실(class 102)은 공간 목록에는 유지하지만 면적을 계산하지 않는다. 평 단위는 저장하지 않는다. 필요하면 프론트엔드가 `spaceAreaM2 / 3.305785`로 표시한다. 계산 결과는 소수점 전체 정밀도로 저장하고, 표시 시점에 반올림한다.

예를 들어 전용면적이 84㎡이고 전체 실내 픽셀이 3000, 거실 픽셀이 1000이면 거실 면적은 28㎡다.

## 오류 처리

- `total_area_pixel_count`가 0 이하이면 분석 응답 오류로 처리하고 공간 면적을 저장하지 않는다.
- 방의 `pixel_count`가 0 이하이면 해당 방은 저장 대상에서 제외한다.
- 방 픽셀 수가 전체 픽셀 수보다 크면 잘못된 AI 응답으로 처리한다.
- 전용면적이 없거나 0 이하이면 기존 요청 검증 오류로 처리한다.
- AI 응답 필드 누락이나 형식 오류는 `AiFloorplanAnalysisException`으로 변환한다.

## 테스트

- AI: 포함 클래스 마스크 합집합의 픽셀 수와 `total_area_pixel_count`가 일치하는지 검증한다.
- AI: 기존 `rooms[].pixel_count`와 응답 필드가 유지되는지 검증한다.
- 백엔드: 84㎡, 전체 3000픽셀, 방 1000픽셀 입력에서 28㎡가 저장되는지 검증한다.
- 백엔드: 0 이하 전체 픽셀, 전체보다 큰 방 픽셀, 누락된 필드를 거부하는지 검증한다.
- 회귀: 기존 AI 및 백엔드 테스트를 실행한다.

## 브랜치 통합

구현과 검증은 `ai` 브랜치에서 수행한다. 이후 원격 `ai`, `backend`, `frontend`, `infra`를 최신 상태로 가져와 `develop`에 병합하고 통합 테스트를 실행한다. 성공한 `develop`을 `main`에 병합·푸시한 뒤, 최신 `main`을 네 하위 브랜치에 병합해 원격 브랜치를 동기화한다.
