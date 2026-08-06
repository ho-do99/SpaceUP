FROM python:3.11-slim

WORKDIR /app

COPY viewer3d/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 8004의 벽선 기반 분석 엔진을 그대로 재사용하고,
# 8003에는 모바일 공간 선택 화면만 별도로 제공합니다.
COPY viewer3d/app ./base_app
COPY viewerwall/app ./wall_app
COPY viewerselect/app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
