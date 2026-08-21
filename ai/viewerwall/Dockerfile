FROM python:3.11-slim

WORKDIR /app

COPY viewer3d/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Reuse the stable 8003 UI and API implementation. viewerwall/app/main.py
# layers the approved line-first viewer and the latest 8004-only cleanup;
# approved_main.py is kept in the same package so the image is self-contained.
COPY viewer3d/app ./base_app
COPY viewerwall/app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
