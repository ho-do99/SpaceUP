# DB 마이그레이션 (Flyway) 시작하는 법

이 폴더에 `V1__init.sql`, `V2__xxx.sql` 형식으로 파일을 넣으면 Flyway가 버전 순서대로 실행합니다.
지금은 비어 있어서 Flyway가 아무 것도 안 하고, 기존처럼 `ddl-auto: update`가 스키마를 관리합니다.

## 처음 한 번, V1 만들기 (제가 손으로 DDL을 안 쓴 이유)

엔티티가 20개가 넘고 저는 실제 DB에 붙어서 검증해본 적이 없어서, 제가 직접 CREATE TABLE문을 타이핑하면
컬럼 타입/제약조건이 실제 Hibernate 결과랑 미묘하게 어긋날 위험이 있습니다. 그래서 Hibernate 본인이
엔티티를 스캔해서 정확한 DDL을 뽑아내도록 전용 프로필(`application-schema-export.yml`)을 만들어뒀습니다.

로컬에서 한 번만 실행하세요:

```bash
./gradlew bootRun --args='--spring.profiles.active=local,schema-export'
```

애플리케이션이 뜨자마자(DB 연결 없이도 동작합니다) `src/main/resources/db/migration/V1__init.sql`
파일이 자동 생성됩니다. 생성된 내용을 한 번 훑어보고 이상 없으면 그대로 커밋하세요.

## V1 적용 후 전환

1. `V1__init.sql`이 생성되고 확인이 끝나면, `application-local.yml`의 `spring.jpa.hibernate.ddl-auto`를
   `update`에서 `validate`로 바꾸세요. 이때부터 스키마 변경은 전부 Flyway 마이그레이션 파일(`V2__...`,
   `V3__...`)로만 해야 합니다.
2. 이후 엔티티를 수정할 때마다: 엔티티 수정 → 변경분만큼 `V2__add_xxx_column.sql` 같은 파일을 새로
   추가 → 앱 재기동 시 Flyway가 자동 적용.
3. 절대로 이미 커밋된 `V1__init.sql` 같은 기존 마이그레이션 파일을 수정하지 마세요. Flyway는 체크섬으로
   변경 여부를 감지해서 에러를 냅니다 — 새 버전 파일을 추가하는 방식으로만 변경하세요.

## 주의

- MySQL 사용 중이라 `flyway-mysql` 모듈을 `build.gradle`에 같이 추가해뒀습니다 (Flyway 10부터 MySQL
  지원이 core에서 분리됐습니다).
- 이 안내와 `application-schema-export.yml` 설정 자체도 로컬에서 한 번 검증해봐야 합니다 — 저는 네트워크
  제약으로 실제 실행을 못 해봤습니다.
