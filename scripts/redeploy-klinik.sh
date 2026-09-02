#!/usr/bin/env bash
# Redeploy KlinikKita di server: tarik kode terbaru, install deps, build, restart PM2.
# Jalankan dari mana saja: ~/klinikkita/scripts/redeploy-klinik.sh
set -euo pipefail

APP_DIR="$HOME/klinikkita"
PM2_NAME="klinikkita"

echo "==> Masuk ke $APP_DIR"
cd "$APP_DIR"

echo "==> git pull"
git pull origin main

echo "==> npm ci"
npm ci

echo "==> npm run build"
npm run build

echo "==> pm2 restart $PM2_NAME"
pm2 restart "$PM2_NAME"

echo "==> Selesai. Cek status:"
pm2 status "$PM2_NAME"
