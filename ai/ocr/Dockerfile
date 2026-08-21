FROM pytorch/pytorch:2.1.2-cuda11.8-cudnn8-runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 DEBIAN_FRONTEND=noninteractive TZ=Asia/Seoul
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential fonts-noto-cjk tesseract-ocr tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir pybind11==2.13.6 \
    && pip install --no-cache-dir fastapi==0.115.8 "uvicorn[standard]==0.33.0" python-multipart==0.0.20 pytesseract==0.3.10 torchvision==0.16.2 numpy==1.26.4 pandas==2.2.3 pillow==11.1.0 pyyaml==6.0.2 tqdm==4.67.1 fastwer==0.1.3 opencv-python-headless==4.10.0.84 gitpython==3.1.44 ipython==8.31.0 matplotlib==3.10.0 psutil==6.1.1 requests==2.32.3 scipy==1.15.1 seaborn==0.13.2
COPY ocr/app ./app
COPY aihub-ocr/OCREvaluation.py /opt/aihub-ocr/OCREvaluation.py
COPY aihub-ocr/model /opt/aihub-ocr/model
COPY aihub-ocr/yolov5 /opt/aihub-ocr/yolov5
EXPOSE 8000
ENTRYPOINT []
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
