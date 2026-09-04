#!/usr/bin/env bash
set -euo pipefail

npx tsc --noEmit

BARREL="$(mktemp --suffix=.ts)"
trap 'rm -f "$BARREL"' EXIT

for f in "$(pwd)"/src/*.ts; do
  printf 'export * from "%s"\n' "${f%.ts}" >> "$BARREL"
done

npx esbuild "$BARREL" --bundle --format=cjs --outfile=dist/core.js

npx esbuild "$BARREL" --bundle --platform=browser --format=iife --global-name=xJS --outfile=dist/core.browser.js
