#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== 敏感檔案檢查 ==="
FAIL=0
for f in .env server/.env; do
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    echo "ERROR: $f 已被 git 追蹤，請先 git rm --cached $f"
    FAIL=1
  else
    echo "OK: $f 未追蹤"
  fi
done

if git ls-files | grep -qiE '(^|/)\.env$|credentials|\.pem$|id_rsa|\.key$'; then
  echo "ERROR: 發現可能含敏感資料的已追蹤檔案"
  git ls-files | grep -iE '(^|/)\.env$|credentials|\.pem$|id_rsa|\.key$' || true
  FAIL=1
else
  echo "OK: 已追蹤檔案無 .env / 金鑰"
fi

echo "=== git status ==="
git status --short

if [[ "$FAIL" -ne 0 ]]; then
  exit 1
fi

echo "=== 全部通過 ==="
