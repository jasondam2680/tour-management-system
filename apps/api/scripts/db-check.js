#!/usr/bin/env node
/**
 * db-check.js — Chẩn đoán kết nối database trước khi chạy migrate.
 *
 * Đọc DATABASE_URL từ apps/api/.env và kiểm tra từng bước:
 *   1. Parse URL            -> sai format?
 *   2. DNS resolve host     -> host "db" chỉ tồn tại TRONG devcontainer
 *   3. TCP connect host:port-> Postgres chưa chạy? sai port?
 *   4. pg connect           -> sai password? database chưa tồn tại?
 *
 * Exit 0 nếu OK. Exit 1 kèm hướng dẫn sửa cụ thể nếu lỗi.
 * Chạy:  cd apps/api && node scripts/db-check.js
 */
const dns = require('dns').promises;
const net = require('net');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function fail(hint) {
  console.error(`${RED}✗ ${hint}${RESET}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`${GREEN}✓ ${msg}${RESET}`);
}
function info(msg) {
  console.log(`${YELLOW}→ ${msg}${RESET}`);
}

async function main() {
  // 1. Đọc .env (không cần dependency dotenv)
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env');
  let rawUrl = '';
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const line = content.split('\n').find((l) => l.trim().startsWith('DATABASE_URL'));
    if (line) rawUrl = line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  } catch {
    fail(`Không đọc được file apps/api/.env.\n  Hãy chạy: ./scripts/setup.sh  (trong tour-op-system/)`);
  }
  if (!rawUrl) {
    fail(`Chưa có DATABASE_URL trong apps/api/.env.\n  Hãy chạy: ./scripts/setup.sh  (trong tour-op-system/)`);
  }

  // Prisma (qua dotenv) ƯU TIÊN biến môi trường shell hơn file .env.
  // Nếu shell đang export DATABASE_URL cũ -> Prisma dùng sai URL dù file đã đúng.
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== rawUrl) {
    const mask = (s) => s.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    fail(
      `Phát hiện DATABASE_URL trong shell KHÁC với trong apps/api/.env!` +
        `\n  Shell đang export: ${mask(process.env.DATABASE_URL.trim())}` +
        `\n  File .env       : ${mask(rawUrl)}` +
        `\n  Prisma ưu tiên biến shell -> sẽ dùng sai URL.` +
        `\n  Cách sửa:  unset DATABASE_URL` +
        `\n  (nếu mở terminal mới vẫn bị, kiểm tra ~/.bashrc có dòng export DATABASE_URL thì xóa đi)`
    );
  }

  // 2. Parse URL
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    fail(`DATABASE_URL sai format: ${rawUrl}\n  Mẫu đúng: postgresql://tour_op_user:<mat-khau>@localhost:5432/tour_op_db`);
  }
  const host = u.hostname;
  const port = Number(u.port || 5432);
  const dbName = u.pathname.replace('/', '').split('?')[0];
  info(`Kiểm tra: ${u.username}@${host}:${port}/${dbName}`);

  // Cảnh báo sớm: host là tên service Docker (chỉ đúng trong devcontainer/mạng compose)
  if (host === 'db' || host === 'postgres') {
    console.log(
      `${YELLOW}! Host "${host}" là tên service Docker — chỉ đúng khi bạn chạy lệnh TRONG devcontainer` +
        ` hoặc trong container cùng mạng compose.${RESET}`
    );
    console.log(
      `${YELLOW}  Nếu bạn đang chạy trên máy host (ngoài Docker), hãy dùng:` +
        ` postgresql://tour_op_user:<mat-khau>@localhost:5432/tour_op_db${RESET}`
    );
    console.log(
      `${YELLOW}  (password xem trong docker-compose.yml -> POSTGRES_PASSWORD; port 5432 do compose map 5432:5432)${RESET}`
    );
  }

  // 3. DNS resolve
  try {
    await dns.lookup(host);
    ok(`Resolve được host "${host}"`);
  } catch {
    let extra = '';
    if (host === 'db') {
      extra =
        `\n  Host "db" chỉ tồn tại TRONG devcontainer (mạng nội bộ Docker).` +
        `\n  Bạn đang chạy lệnh trên máy host nhưng lại dùng URL của devcontainer.` +
        `\n  Sửa apps/api/.env thành: postgresql://tour_op_user:<mat-khau>@localhost:5432/tour_op_db` +
        `\n  (password xem trong docker-compose.yml -> POSTGRES_PASSWORD)` +
        `\n  Hoặc chạy: ./scripts/setup.sh  (tự sửa giúp bạn)`;
    }
    fail(`Không resolve được host "${host}".${extra}`);
  }

  // 4. TCP connect
  const tcpOk = await new Promise((resolve) => {
    const sock = new net.Socket();
    const timer = setTimeout(() => {
      sock.destroy();
      resolve(false);
    }, 5000);
    sock.on('connect', () => {
      clearTimeout(timer);
      sock.destroy();
      resolve(true);
    });
    sock.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
    sock.connect(port, host);
  });
  if (!tcpOk) {
    fail(
      `Không kết nối được tới ${host}:${port} (connection refused/timeout).` +
        `\n  1. Postgres chưa chạy? ->  cd tour-op-system && docker compose up -d postgres` +
        `\n  2. Sai port? docker-compose.yml map 5432:5432 — từ máy host dùng port 5432.` +
        `\n  3. Dùng Postgres cài trực tiếp? Hãy chắc nó đang chạy và port đúng trong URL.`
    );
  }
  ok(`Mở được cổng TCP ${host}:${port}`);

  // 5. pg connect (xác thực + database tồn tại)
  let Client;
  try {
    Client = require('pg').Client;
  } catch {
    fail(`Thiếu package "pg". Hãy chạy: npm install  (trong tour-op-system/)`);
  }
  const client = new Client({
    host,
    port,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: dbName,
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    await client.query('SELECT 1');
    ok(`Đăng nhập database "${dbName}" thành công. Có thể chạy migrate.`);
  } catch (e) {
    const code = e.code || '';
    const pgErrorHinted = code === 'ECONNRESET' || code === 'ECONNREFUSED' || e.message.includes('terminated unexpectedly');
    if (pgErrorHinted) {
      // Tự thử lại bằng 127.0.0.1 để xác nhận bệnh "localhost -> IPv6 ::1 bị service khác chiếm"
      let v4ok = false;
      if (host === 'localhost') {
        try {
          const c2 = new Client({
            host: '127.0.0.1',
            port,
            user: decodeURIComponent(u.username),
            password: decodeURIComponent(u.password),
            database: dbName,
            connectionTimeoutMillis: 8000,
          });
          await c2.connect();
          await c2.query('SELECT 1');
          await c2.end().catch(() => {});
          v4ok = true;
        } catch {
          v4ok = false;
        }
      }
      if (v4ok) {
        fail(
          `Đã tìm ra nguyên nhân: "localhost" trên máy bạn resolve ra IPv6 ::1 trước,` +
            ` và có service khác (thường là hệ thống forward port của Codespaces) đang chiếm [::1]:${port}` +
            ` -> pg nối nhầm vào nó thay vì Postgres.` +
            `\n  Cách sửa: dùng 127.0.0.1 thay vì localhost trong DATABASE_URL:` +
            `\n  postgresql://${u.username}:***@127.0.0.1:${port}/${dbName}` +
            `\n  (đã xác nhận 127.0.0.1 kết nối OK). Chạy ./scripts/setup.sh để tự sửa.`
        );
      }
      fail(
        `TCP mở được nhưng Postgres (hoặc thứ gì đó) đóng kết nối ngay khi handshake (${code || e.message}).` +
          `\n  1. Map SAI port trong docker-compose.yml? Phải là '5432:5432'` +
          `\n     (số SAU dấu : phải là 5432). Sai thành '5432:6432' sẽ ra lỗi này.` +
          `\n     Sửa xong: docker compose up -d postgres` +
          `\n  2. Có service khác chiếm port ${port}? Kiểm tra:  ss -tlnp | grep ${port}` +
          `\n  3. Xem Postgres có log lỗi gì không:  docker logs tour_op_postgres --tail 30` +
          `\n  4. Thử 127.0.0.1 thay vì localhost trong DATABASE_URL.`
      );
    }
    if (code === '28P01') {
      fail(
        `Sai username/password (28P01).` +
          `\n  Password đúng nằm trong docker-compose.yml -> POSTGRES_PASSWORD.` +
          `\n  Nếu bạn từng sửa POSTGRES_USER/PASSWORD rồi up lại: volume cũ vẫn giữ` +
          `\n  user/password cũ -> chạy: docker compose down -v  (XÓA dữ liệu dev) rồi up lại.` +
          `\n  Hoặc chạy: ./scripts/setup.sh  (tự đồng bộ lại DATABASE_URL)`
      );
    }
    if (code === '3D000') {
      fail(
        `Database "${dbName}" chưa tồn tại (3D000).` +
          `\n  Nếu dùng docker-compose.yml của repo, database phải là "tour_op_db" (tự tạo khi container chạy lần đầu).` +
          `\n  Kiểm tra lại tên database trong URL.`
      );
    }
    fail(`Lỗi kết nối Postgres (${code || 'không rõ mã'}): ${e.message}`);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((e) => fail(`Lỗi không mong đợi: ${e.message}`));
