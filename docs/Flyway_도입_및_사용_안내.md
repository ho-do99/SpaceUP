# Flyway 도입 및 사용 안내

## 한 줄 설명

Flyway는 DB 구조 변경 SQL을 버전 순서대로 딱 한 번씩 실행하고, 실행 이력을 DB에 남기는 도구다. SpaceUP에서는 애플리케이션이 DB를 임의로 고치던 `ddl-auto=update` 대신 Flyway가 구조 변경을 맡고, Hibernate는 `ddl-auto=validate`로 코드와 DB가 맞는지만 검사한다.

## 왜 도입했는가

- 팀원마다 애플리케이션 실행 시점이 달라도 같은 순서로 DB가 변경된다.
- 어떤 SQL이 언제 적용됐는지 `flyway_schema_history`에서 확인할 수 있다.
- 새로 clone한 환경도 빈 DB에서 현재 25개 테이블과 기준 자재 36건을 재현할 수 있다.
- 엔티티만 바꾸고 DB 변경을 빼먹으면 시작 단계의 `validate`에서 즉시 드러난다.
- 이미 적용된 SQL은 체크섬으로 보호되어 과거 이력을 몰래 고치는 일을 막는다.

## 현재 파일 역할

- `V1__baseline_schema.sql`: 검증된 업무 테이블 25개의 기준 스키마
- `V2__reference_material_catalog.sql`: 모던·우드·화이트·대리석 테마별 자재 36건
- 다음 변경: 반드시 `V3__설명.sql`부터 새 파일로 추가

기존 실DB는 이미 V1/V2 내용이 들어 있으므로 최초 도입 시 버전 2로 기준선만 기록했다. 빈 DB에서는 V1과 V2가 실제로 실행된다. 두 방식 모두 애플리케이션 시작과 Hibernate 검증까지 확인했다.

## 팀원이 확인하는 방법

```sql
SELECT installed_rank, version, description, type, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

기존 DB에서는 `version=2`, `type=BASELINE`이 보이는 것이 정상이다. 새 빈 DB에서는 V1과 V2가 각각 `SQL`로 보인다.

## DB를 바꿀 때 지켜야 할 순서

1. 변경 전 DB 전체 백업을 만든다.
2. 마지막 버전 다음 번호의 SQL 파일을 추가한다.
3. 같은 작업에서 엔티티·DTO·Repository 등 관련 코드를 맞춘다.
4. 새 빈 DB와 기존 DB 양쪽에서 마이그레이션을 검증한다.
5. `ddl-auto=validate`, 백엔드 테스트, 프론트 테스트·빌드를 통과시킨다.
6. 변경 이유·영향·복구 방법을 작업 변경이력에 남긴다.

## 절대 하면 안 되는 것

- 적용된 V1/V2 파일 수정 또는 이름 변경
- `flyway_schema_history` 직접 수정·삭제
- 운영 DB에서 `flyway clean` 실행
- `ddl-auto=update`, `create`, `create-drop` 재사용
- 백업 없이 컬럼 삭제·이름 변경·고유 제약 추가

## 설정상 안전장치

- `spring.flyway.clean-disabled: true`: 실수로 전체 스키마를 지우는 clean 차단
- `spring.jpa.hibernate.ddl-auto: validate`: Hibernate의 자동 구조 변경 차단
- 로컬 프로필의 자동취소 스케줄러 비활성화: 개발·검증 실행이 샘플 의뢰 상태를 바꾸지 않게 보호
- `schema-export` 출력 위치를 `build/schema-export.sql`로 분리: 기준 마이그레이션 덮어쓰기 방지

## 수동 마이그레이션 폴더와 차이

`database/migrations`는 Flyway 도입 전에 실DB를 정리한 과거 작업 기록이다. 새 환경에서 이 파일들을 다시 하나씩 실행하지 않는다. 앞으로 자동 적용되는 공식 변경 파일은 `backend/src/main/resources/db/migration`에만 둔다.
