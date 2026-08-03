FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["sh","-c","echo '===== STARTING =====' && pwd && ls -la && which alembic && alembic current && alembic upgrade head && echo '===== MIGRATIONS COMPLETE =====' && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
