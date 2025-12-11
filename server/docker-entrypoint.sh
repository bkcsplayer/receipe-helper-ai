#!/bin/sh
set -e

echo "🗂️ Running Prisma migrations..."
npx prisma migrate deploy

if [ "$1" = "worker" ]; then
  echo "🛠️ Launching worker..."
  exec node worker.js
else
  echo "🚀 Starting API server..."
  exec node index.js
fi

