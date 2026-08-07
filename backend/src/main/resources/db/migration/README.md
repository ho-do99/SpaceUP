# SpaceUP Flyway 마이그레이션

이 폴더가 백엔드 실행 시 자동 적용되는 공식 DB 변경 경로다.

## 현재 기준

- `V1__baseline_schema.sql`: 2026-08-07 검증된 25개 테이블 전체 기준 스키마
- `V2__reference_material_catalog.sql`: 4개 테마 × 3개 시공 종류 × 3개 가격대의 자재 36건
- 기존 실DB: 이미 V1/V2 상당 구조와 데이터를 보유하므로 `baseline-version: 2`로 이력만 시작
- 새 빈 DB: V1과 V2를 순서대로 실제 실행
- Hibernate: `ddl-auto=validate`로 구조를 검사할 뿐 생성·수정하지 않음

## 왜 Flyway를 사용하는가

`ddl-auto=update`는 애플리케이션을 실행한 사람의 시점에 따라 Hibernate가 DB를 조용히 바꾼다. 변경 이력, 실행 순서, 팀원별 동일성을 보장하지 못하고 컬럼 삭제·이름 변경 같은 작업도 안전하게 처리하지 못한다.

Flyway는 `V3__...sql`, `V4__...sql`처럼 번호가 붙은 SQL을 정확히 한 번씩 실행하고, `flyway_schema_history`에 버전·성공 여부·체크섬을 기록한다. 따라서 새로 clone한 환경과 기존 DB가 같은 순서로 진화한다.

## 새 마이그레이션 작성 규칙

1. 이미 적용된 V1/V2 파일은 절대로 수정하지 않는다.
2. 다음 변경은 `V3__설명.sql`부터 새 파일로 추가한다.
3. DB 구조와 이를 사용하는 엔티티 변경은 같은 작업에 포함한다.
4. 적용 전 실DB 전체 백업을 만든다.
5. 빈 DB 적용, 기존 DB 업그레이드, `ddl-auto=validate`, 전체 테스트를 모두 확인한다.
6. 운영 데이터 정책이 불명확하면 고유키·삭제·컬럼명 변경을 미루고 기록한다.

## 기존 `database/migrations` 폴더

`database/migrations/20260806_*.sql`, `20260807_*.sql`은 현재 실DB를 25개 구조로 정리하는 과정에서 수동 적용한 작업 기록이다. 새 환경에서는 이 파일들을 하나씩 실행하지 않고 V1/V2 기준선을 사용한다. 향후 자동 마이그레이션은 이 폴더가 아니라 현재 `classpath:db/migration` 폴더에만 추가한다.

## 스키마 비교용 DDL

`schema-export` 프로필은 비교용 Hibernate DDL을 `build/schema-export.sql`에 생성한다. Flyway 파일을 자동으로 덮어쓰지 않는다. 출력 결과는 참고용이며, 검토 없이 마이그레이션으로 사용하면 안 된다.

## 금지 사항

- 적용된 마이그레이션 파일 수정
- `flyway_schema_history` 수동 편집
- 운영 환경에서 Flyway `clean` 실행
- `ddl-auto=update` 또는 `create` 재사용
- 실데이터 확인 없이 테이블·컬럼 삭제
