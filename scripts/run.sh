#!/usr/bin/env bash
set -euo pipefail

# Stop any running Expo/Metro instances, clean reinstall and start Expo with cache clear
# - Removes common build caches and node_modules
# - Reinstalls deps with legacy peer resolution
# - Starts Expo with a clean Metro cache

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔧 Working directory: $(pwd)"

echo "🛑 Stopping existing Expo/Metro dev servers (if any)..."

kill_port() {
  local port="$1"
  # macOS/Linux with lsof
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti tcp:"$port" || true)
    if [[ -n "${pids}" ]]; then
      echo "  • Killing processes on port ${port}: ${pids}"
      kill -9 ${pids} || true
    fi
  # Linux with fuser
  elif command -v fuser >/dev/null 2>&1; then
    echo "  • Killing processes on port ${port} via fuser"
    fuser -k "${port}/tcp" || true
  fi
}

# Common Expo/Metro ports
for p in 8081 19000 19001 19002 19006; do
  kill_port "$p"
done

# Fallback pattern-based kill (scoped to known dev processes)
pkill -f "expo start" >/dev/null 2>&1 || true
pkill -f "@expo/dev-server" >/dev/null 2>&1 || true
pkill -f "metro" >/dev/null 2>&1 || true
pkill -f "react-native/scripts/launchPackager.command" >/dev/null 2>&1 || true

echo "🧹 Cleaning caches and build artifacts..."
rm -rf \
  node_modules \
  .expo \
  .expo-shared \
  dist \
  build \
  .turbo \
  .cache \
  .vite \
  coverage \
  ios/build \
  android/build || true

# Optional: clean Watchman (if installed) to avoid stale watchers
if command -v watchman >/dev/null 2>&1; then
  echo "🧽 Clearing Watchman watches..."
  watchman watch-del-all || true
fi

echo "📦 Installing dependencies (legacy peer deps)..."
npm install --legacy-peer-deps

echo "🚀 Starting Expo with clean cache..."
npx expo start -c
