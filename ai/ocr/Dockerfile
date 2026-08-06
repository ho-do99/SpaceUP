FROM floorplan4:latest
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 DEBIAN_FRONTEND=noninteractive TZ=Asia/Seoul
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-noto-cjk tesseract-ocr tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir fastapi==0.115.8 "uvicorn[standard]==0.33.0" python-multipart==0.0.20 pytesseract==0.3.10
COPY ocr/app ./app
COPY aihub-ocr/OCREvaluation.py /opt/aihub-ocr/OCREvaluation.py
COPY aihub-ocr/model /opt/aihub-ocr/model
COPY aihub-ocr/yolov5 /opt/aihub-ocr/yolov5
EXPOSE 8000
ENTRYPOINT []
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
