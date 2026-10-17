#!/bin/bash
# setup.sh — Dựng database cho tour-op-system bằng MỘT lệnh.
#
# Làm gì:
#   1. Kiểm tra Docker
#   2. Đọc POSTGRES_DB/USER/PASSWORD từ docker-compose.yml
#      -> GHI ĐÈ DATABASE_URL trong apps/api/.env cho khớp (không bao giờ lệch)
#   3. docker compose up -d postgres + chờ healthy
#   4. Tự tạo database nếu chưa có (trường hợp volume cũ init bằng tên DB khác)
#   5. Kiểm tra kết nối (scripts/db-check.js) — lỗi in hướng dẫn tiếng Việt
#   6. prisma generate + prisma migrate dev
#
# Chạy:  ./scripts/setup.sh            (trong tour-op-system/)
#        ./scripts/setup.sh --seed      (kèm seed dữ liệu demo)
set -e
cd "$(dirname "$0")/.."

echo "=== 1/7 Cài dependencies ==="
# Kiểm tra xlsx (dep mới nhất được thêm) có resolve được không; nếu không -> npm install
if node -e "require.resolve('xlsx', {paths:[process.cwd()+'/apps/api']})" >/dev/null 2>&1; then
  echo "✓ Dependencies đã đủ (bỏ qua npm install)"
else
  echo "→ Thiếu package (ví dụ: xlsx). Chạy npm install ..."
  npm install
  echo "✓ npm install xong"
fi

echo "=== 2/7 Kiểm tra Docker ==="
if ! command -v docker >/dev/null 2>&1; then
  echo "✗ Chưa cài Docker. Cài Docker Desktop (https://www.docker.com/products/docker-desktop/) rồi chạy lại."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "✗ Docker chưa chạy. Hãy mở Docker Desktop rồi chạy lại script này."
  exit 1
fi
echo "✓ Docker OK"

echo "=== 3/7 Đồng bộ DATABASE_URL từ docker-compose.yml ==="
PG_DB=$(grep -E "^\s*POSTGRES_DB" docker-compose.yml | head -1 | sed 's/.*POSTGRES_DB:\s*//')
PG_USER=$(grep -E "^\s*POSTGRES_USER" docker-compose.yml | head -1 | sed 's/.*POSTGRES_USER:\s*//')
PG_PASS=$(grep -E "^\s*POSTGRES_PASSWORD" docker-compose.yml | head -1 | sed 's/.*POSTGRES_PASSWORD:\s*//')
[ -z "$PG_DB" ] && PG_DB="tour_op_db"
[ -z "$PG_USER" ] && PG_USER="tour_op_user"
[ -z "$PG_PASS" ] && PG_PASS="tour_op_pass_2024"
# Port host = số TRƯỚC dấu : trong map "5432:5432" của service postgres
PG_PORT=$(grep -A 3 "ports:" docker-compose.yml | grep -oE "'[0-9]+:[0-9]+'" | head -1 | tr -d "'" | cut -d: -f1)
[ -z "$PG_PORT" ] && PG_PORT="5432"
# Dùng 127.0.0.1 (KHÔNG dùng "localhost"): "localhost" có thể resolve ra IPv6 ::1
# trước, và trong Codespaces có thể có service khác chiếm [::1]:PORT -> pg nối nhầm.
# 127.0.0.1 luôn trỏ đúng docker-proxy (IPv4).
URL="postgresql://${PG_USER}:${PG_PASS}@127.0.0.1:${PG_PORT}/${PG_DB}"
echo "→ Dùng: postgresql://${PG_USER}:***@127.0.0.1:${PG_PORT}/${PG_DB}"
# Prisma ưu tiên biến môi trường shell hơn file .env -> export đè để tránh
# trường hợp shell đang giữ DATABASE_URL cũ (sẽ gây P1001 dù file đã đúng).
export DATABASE_URL="$URL"

mkdir -p apps/api
if [ ! -f apps/api/.env ]; then
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "doi-chuoi-nay-di")
  cat > apps/api/.env <<EOF
# Tự sinh bởi scripts/setup.sh — đồng bộ từ docker-compose.yml
DATABASE_URL="${URL}"
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_SECRET}"
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
  echo "✓ Đã tạo apps/api/.env"
else
  if grep -q "^DATABASE_URL" apps/api/.env; then
    sed -i "s|^DATABASE_URL.*|DATABASE_URL=\"${URL}\"|" apps/api/.env
  else
    echo "DATABASE_URL=\"${URL}\"" >> apps/api/.env
  fi
  echo "✓ Đã cập nhật DATABASE_URL trong apps/api/.env cho khớp docker-compose.yml"
fi

echo "=== 4/7 Khởi động Postgres ==="
docker compose up -d postgres
echo "→ Chờ Postgres healthy ..."
for i in $(seq 1 30); do
  if docker exec tour_op_postgres pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
    echo "✓ Postgres đã sẵn sàng"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "✗ Postgres không healthy sau 60s. Xem log: docker compose logs postgres"
    exit 1
  fi
  sleep 2
done

echo "=== 5/7 Đảm bảo database tồn tại ==="
EXISTS=$(docker exec -e PGPASSWORD="$PG_PASS" tour_op_postgres psql -U "$PG_USER" -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname='$PG_DB'" 2>/dev/null || echo "AUTH_FAIL")
if [ "$EXISTS" = "AUTH_FAIL" ]; then
  echo "✗ Không đăng nhập được bằng user/password trong docker-compose.yml."
  echo "  Nguyên nhân thường gặp: volume postgres_data được init từ lần chạy trước"
  echo "  với POSTGRES_USER/PASSWORD khác (bạn từng sửa compose rồi up lại)."
  echo "  Cách sửa (XÓA dữ liệu dev hiện tại):  docker compose down -v"
  echo "  rồi chạy lại script này."
  exit 1
elif [ "$EXISTS" = "1" ]; then
  echo "✓ Database \"$PG_DB\" đã tồn tại"
else
  docker exec -e PGPASSWORD="$PG_PASS" tour_op_postgres psql -U "$PG_USER" -d postgres \
    -c "CREATE DATABASE \"$PG_DB\"" >/dev/null
  echo "✓ Đã tạo database \"$PG_DB\""
fi

echo "=== 6/7 Kiểm tra kết nối ==="
node apps/api/scripts/db-check.js

echo "=== 7/7 Prisma generate + migrate ==="
npm run db:generate
npm run db:migrate

if [ "$1" = "--seed" ]; then
  echo "=== Seed dữ liệu demo ==="
  npm run db:seed
fi

echo ""
echo "✓ Xong! Chạy thử:  npm run dev   (trong tour-op-system/)"
