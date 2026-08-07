# NCP Object Storage 이미지 저장 전환

## 변경 목적

- 서버 컨테이너 내부 파일은 재배포 시 유실될 수 있으므로, 사용자 방 사진과 Gemini 생성 이미지를 private NCP Object Storage로 분리한다.
- 데이터베이스에는 파일 자체가 아니라 기존 API 경로(`/api/files/images/{파일명}`)만 저장한다.
- 기존 프론트 화면과 API 계약을 유지하여 디자인 및 호출 코드 변경을 피한다.

## 권한 설계

- Bucket: `spaceup-images-20260807` (private)
- Sub Account: `spaceup-storage-writer`
- 사용자 정의 정책: `spaceup-object-storage-writer`
- 허용: 버킷 목록 조회, 해당 버킷 객체 조회, 업로드/교체/삭제
- 차단: 다른 버킷 접근, 버킷 생성/삭제, CORS/공개 설정 변경

## 백엔드 변경

- `ImageStoreService`는 `NCP_OBJECT_STORAGE_ENABLED=true`일 때만 S3 호환 Object Storage를 사용한다.
- 저장 Object Key는 `images/{uuid.확장자}` 형식이다.
- 이미지 제공 URL은 기존 `/api/files/images/{파일명}`을 유지한다. 따라서 프론트 수정과 DB 마이그레이션이 필요 없다.
- 로컬 개발 환경은 활성화하지 않으면 기존 `FILE_UPLOAD_DIR` 파일 저장 방식을 계속 사용한다.

## 배포 프론트 API 주소 보완

- 원인: Vite 빌드에 `VITE_API_BASE_URL`이 주입되지 않으면 기존 기본값 `http://localhost:8090`이 사용자 브라우저에 남는다.
- 조치: localhost에서만 로컬 백엔드를 사용하고, 배포 도메인에서는 현재 origin의 `/api` Nginx reverse proxy를 사용한다.
- 영향: 화면 디자인과 API 경로는 변경하지 않는다. 로그인, 회원가입 API, 이미지 업로드를 포함한 모든 브라우저 API 요청이 배포 백엔드로 향한다.

## 배포 CORS 보완

- 원인: 브라우저는 HTTPS 도메인에서 POST 요청 시 Origin 헤더를 포함한다. 기존 보안 설정은 localhost Origin만 하드코딩해 로그인 요청을 403으로 차단했다.
- 조치: `app.cors.allowed-origins` 설정값을 읽도록 변경하고, 로컬 개발 주소와 현재 HTTPS 도메인을 기본 허용 목록에 포함한다.
- 최종 조치: Compose가 `APP_CORS_ALLOWED_ORIGINS`를 전달하지 않게 한다. URL 목록은 애플리케이션 설정 기본값에서 관리하고, 향후 도메인 변경 시에만 사설 서버의 비밀 환경파일에서 명시적으로 덮어쓴다.
- 영향: 인증·이미지 업로드 등 브라우저 POST 요청이 Nginx 경유 백엔드로 정상 전달된다. DB 변경은 없다.

## 사설 서버 비밀 환경변수

`/home/ubuntu/spaceup-secret.env`에만 다음 값을 둔다. Access Key와 Secret Key는 Git, Docker 이미지, 채팅에 기록하지 않는다.

```env
NCP_OBJECT_STORAGE_ENABLED=true
NCP_OBJECT_STORAGE_ACCESS_KEY=...
NCP_OBJECT_STORAGE_SECRET_KEY=...
```

Endpoint, region, bucket은 애플리케이션의 비밀이 아닌 기본 설정으로 관리한다.

## 검증 순서

1. 사설 서버에서 backend 컨테이너를 재빌드한다.
2. 이미지 업로드 API로 사진 한 장을 업로드한다.
3. 응답 URL로 이미지 조회가 되는지 확인한다.
4. Object Storage의 `images/` 경로에 객체가 생성됐는지 확인한다.
5. Gemini 이미지 생성 결과도 동일한 경로에 생성되는지 확인한다.
