FROM python:3.12

WORKDIR /app

COPY etl/requirements.txt etl/requirements.txt
RUN pip install --no-cache-dir -r etl/requirements.txt

# Install dotenvx
RUN curl -sfS https://dotenvx.sh | sh

# Install supercronic
RUN apt-get update && apt-get install -y curl && \
    curl -L -o /usr/local/bin/supercronic https://github.com/aptible/supercronic/releases/download/v0.2.24/supercronic-linux-amd64 && \
    chmod +x /usr/local/bin/supercronic && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY etl/cronjob /app/cronjob
COPY etl/src etl/src

EXPOSE 8080

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "etl.src.server:app", "--host", "0.0.0.0", "--port", "8080"]
