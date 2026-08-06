FROM python:3.11-slim

WORKDIR /app

COPY viewer3d/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Reuse the stable 8003 UI and API implementation, then replace only the
# display-polygon postprocessor with the experimental wall-guided version.
COPY viewer3d/app ./base_app
COPY viewerwall/app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
