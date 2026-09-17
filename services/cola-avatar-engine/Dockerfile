FROM pytorch/pytorch:2.2.2-cuda12.1-cudnn8-runtime
ARG MUSETALK_REV=0a89dec45a0192b824e3cf4daf96c239440c5ed8
RUN apt-get update && apt-get install -y --no-install-recommends git ffmpeg libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/TMElyralab/MuseTalk.git /opt/MuseTalk && cd /opt/MuseTalk && git checkout "$MUSETALK_REV" && rm -rf .git data testdata
ENV PYTHONPATH=/opt/MuseTalk PYTHONUNBUFFERED=1 HF_HUB_DISABLE_TELEMETRY=1 HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd --uid 10001 --create-home avatar && chown -R avatar:avatar /app
USER avatar
EXPOSE 8000
CMD ["python", "server.py"]
