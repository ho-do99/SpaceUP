# SpaceUP AI 서비스 (8001~8004)

AI Hub 사전학습 OCR·SPA 모델과 두 개의 평면도 화면을 한 번에 실행하는 구성입니다.

| 포트 | 폴더 | 기능 | 접속 주소 |
|---:|---|---|---|
| 8001 | `ocr/` | OCR API: 공간명과 도면 문자 인식 | `http://localhost:8001/docs` |
| 8002 | `spa/` | SPA API: 공간 세그멘테이션과 픽셀 통계 | `http://localhost:8002/docs` |
| 8003 | `viewerselect/` | 공간 정보 확인 및 다중 선택 화면 | `http://localhost:8003/` |
| 8004 | `viewerwall/` | 벽선 보정 기반 3D 평면도 화면 | `http://localhost:8004/` |

## 폴더 구조

```text
ai/
├─ ocr/                       8001 OCR API
├─ spa/                       8002 SPA API
├─ viewer3d/                  뷰어 공통 기반 코드
├─ viewerselect/              8003 공간 선택 화면
├─ viewerwall/                8004 벽선 보정 3D 화면
│  └─ app/
│     ├─ approved_main.py  검증된 벽 기하 기반
│     └─ main.py           표시용 짧은 돌출·계단 보정 래퍼
├─ aihub-ocr/                 OCR 실행 코드와 가중치
├─ model_weights/
│  └─ segmentation/           SPA FP·CS 가중치
└─ docker-compose.yml         4개 서비스 통합 실행 설정
```

## 실행

Docker Desktop을 실행한 뒤 저장소의 `ai` 폴더에서 다음 명령을 실행합니다.

```powershell
git lfs pull
docker compose up -d --build
```

상태 확인:

```powershell
docker compose ps
curl.exe http://localhost:8001/health
curl.exe http://localhost:8002/health
```

## 모델 및 실행 환경

- OCR: AI Hub YOLOv5 + CRNN 사전학습 모델
- SPA: AI Hub DeepLabV3Plus FP/CS 사전학습 모델
- 8003·8004: OCR·SPA 결과를 조합하는 사용자 화면 및 규칙 기반 후처리
- 8003·8004는 공통 `viewer3d` API 계약을 유지하고, `viewerwall` 래퍼에서만 최종 벽선·OCR 앵커를 보정합니다.
- 8004는 긴 수평·수직 벽선을 유지하고 짧은 돌출·계단형 표시 조각만 정리합니다. 8001 OCR과 8002 SPA 모델 가중치는 변경하지 않습니다.
- 모델을 새로 학습하지 않으며 기존 가중치와 OpenCV 기반 후처리를 사용합니다.
- 모델 가중치(`*.pt`, `*.pth`)는 Git LFS로 관리합니다.
- OCR 이미지는 로컬 Docker 이미지 `floorplan4:latest`를 기반으로 빌드하므로, 해당 이미지가 없는 PC에서는 먼저 공유된 이미지를 로드해야 합니다.
