FROM python:3.11-slim

WORKDIR /app

COPY viewer3d/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY viewer3d/app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
