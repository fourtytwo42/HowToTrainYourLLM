FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04
WORKDIR /workspace
COPY . .
RUN apt-get update && apt-get install -y python3-pip git && \
    pip3 install --upgrade pip && \
    pip3 install -r requirements.txt
CMD ["python3", "worker_entrypoint.py"] 